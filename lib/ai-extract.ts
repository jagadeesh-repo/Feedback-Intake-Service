import { FeedbackContentSchema, type FeedbackContent } from "./schema";

const MOCK_RESPONSE: FeedbackContent = {
  category: "other",
  sentiment: "neutral",
  severity: "low",
  summary: "Mocked summary of the feedback.",
  suggestedAction: "Mocked suggested action.",
};

function isRealAiEnabled(): boolean {
  return process.env.USE_REAL_AI === "true";
}

async function callAnthropic(text: string): Promise<unknown> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is required when USE_REAL_AI=true");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `Extract structured feedback data from the following user feedback. Respond with ONLY a JSON object matching this shape, no prose, no markdown fences:\n{"category": "bug|feature_request|praise|other", "sentiment": "positive|neutral|negative", "severity": "low|medium|high", "summary": "one line summary", "suggestedAction": "short next step"}\n\nFeedback: """${text}"""`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { content: { type: string; text: string }[] };
  const textBlock = data.content.find((block) => block.type === "text");
  if (!textBlock) {
    throw new Error("Anthropic response contained no text block");
  }

  return JSON.parse(textBlock.text);
}

export async function callModel(text: string): Promise<unknown> {
  if (!isRealAiEnabled()) {
    return MOCK_RESPONSE;
  }
  return callAnthropic(text);
}

export function parseContent(
  raw: unknown
): { success: true; data: FeedbackContent } | { success: false; error: string } {
  const result = FeedbackContentSchema.safeParse(raw);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.message };
}
