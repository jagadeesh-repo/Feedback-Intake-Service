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
  const extraction = await extractFeedbackContent(text);
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
