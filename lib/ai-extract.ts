import { FeedbackContentSchema, type FeedbackContent } from "./schema";

const MOCK_RESPONSE: FeedbackContent = {
  category: "other",
  sentiment: "neutral",
  severity: "low",
  summary: "Mocked summary of the feedback.",
  suggestedAction: "Mocked suggested action.",
};

// Deliberately violates FeedbackContentSchema (invalid category, missing
// fields) so that `MOCK_AI_MODE=invalid` can exercise the extraction_failed
// path end-to-end offline — see README. A testing affordance, mock-path only.
const INVALID_MOCK_RESPONSE: unknown = { category: "not_a_real_category" };

function isRealAiEnabled(): boolean {
  return process.env.USE_REAL_AI === "true";
}

function mockResponse(): unknown {
  return process.env.MOCK_AI_MODE === "invalid" ? INVALID_MOCK_RESPONSE : MOCK_RESPONSE;
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
      model: "claude-sonnet-5",
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

  return extractJson(textBlock.text);
}

/**
 * Best-effort extraction of a JSON object from a model's text response.
 *
 * Models frequently wrap JSON in markdown fences (```json ... ```) or add a
 * sentence of prose despite being told not to. Rather than throwing on those
 * (which would bypass the retry-then-flag gate and surface as a 500), we try a
 * few progressively looser strategies and, if none parse, return the raw text
 * unchanged so that downstream schema validation fails and the record is
 * flagged as extraction_failed — a bad response is a contract problem, not a
 * crash.
 */
export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const candidates = [trimmed];

  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenceMatch) {
    candidates.push(fenceMatch[1].trim());
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    candidates.push(trimmed.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Try the next, looser candidate.
    }
  }

  return text;
}

export async function callModel(text: string): Promise<unknown> {
  if (!isRealAiEnabled()) {
    return mockResponse();
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

export type ExtractionResult =
  | { status: "ok"; content: FeedbackContent }
  | { status: "extraction_failed"; error: string; rawOutput: unknown };

export async function extractFeedbackContent(
  text: string,
  modelCaller: (text: string) => Promise<unknown> = callModel
): Promise<ExtractionResult> {
  const firstRaw = await modelCaller(text);
  const first = parseContent(firstRaw);
  if (first.success) {
    return { status: "ok", content: first.data };
  }

  const secondRaw = await modelCaller(text);
  const second = parseContent(secondRaw);
  if (second.success) {
    return { status: "ok", content: second.data };
  }

  return { status: "extraction_failed", error: second.error, rawOutput: secondRaw };
}
