import { NextRequest, NextResponse } from "next/server";
import { SubmitFeedbackRequestSchema, FeedbackRecordSchema } from "@/lib/schema";
import { extractFeedbackContent } from "@/lib/ai-extract";
import { generateFeedbackId } from "@/lib/id";
import { saveRecord, listRecords } from "@/lib/store";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsedRequest = SubmitFeedbackRequestSchema.safeParse(body);
  if (!parsedRequest.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsedRequest.error.issues },
      { status: 400 }
    );
  }

  const { text } = parsedRequest.data;

  // A bad *response* from the model (unparseable or schema-invalid content) is
  // handled inside extractFeedbackContent and flows through the retry-then-flag
  // gate. A thrown error here means the model could not be reached at all
  // (network failure, missing/invalid API key, non-200) — that is not a flagged
  // record, it is an upstream outage, so surface it as a 502 rather than
  // storing a fake "extraction_failed" record or crashing with a 500.
  let extraction;
  try {
    extraction = await extractFeedbackContent(text);
  } catch {
    return NextResponse.json(
      { error: "Feedback extraction is temporarily unavailable" },
      { status: 502 }
    );
  }

  const submittedAt = new Date().toISOString();
  const id = generateFeedbackId();

  const recordCandidate =
    extraction.status === "ok"
      ? {
          id,
          submittedAt,
          status: "new" as const,
          rawText: text,
          ...extraction.content,
        }
      : {
          id,
          submittedAt,
          status: "extraction_failed" as const,
          rawText: text,
          category: "other" as const,
          sentiment: "neutral" as const,
          severity: "low" as const,
          summary: "Extraction failed — see extractionError.",
          suggestedAction: "Review manually.",
          extractionError: extraction.error,
        };

  const parsedRecord = FeedbackRecordSchema.safeParse(recordCandidate);
  if (!parsedRecord.success) {
    return NextResponse.json(
      { error: "Internal contract violation", issues: parsedRecord.error.issues },
      { status: 500 }
    );
  }

  saveRecord(parsedRecord.data);
  return NextResponse.json(parsedRecord.data, { status: 201 });
}

export async function GET() {
  return NextResponse.json(listRecords());
}
