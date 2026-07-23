import { NextRequest, NextResponse } from "next/server";
import { SubmitFeedbackRequestSchema } from "@/lib/schema";
import { createFeedbackRecord } from "@/lib/submit-feedback";
import { listRecords } from "@/lib/store";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsedRequest = SubmitFeedbackRequestSchema.safeParse(body);
  if (!parsedRequest.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsedRequest.error.issues },
      { status: 400 }
    );
  }

  const outcome = await createFeedbackRecord(parsedRequest.data.text);

  if (!outcome.ok) {
    // A bad *response* from the model is handled inside the retry-then-flag gate
    // and still yields an ok record. These two cases are genuine failures:
    // upstream unreachable (an outage, surface as 502) or an internal contract
    // violation (a "should never happen" assembly bug, surface as 500).
    if (outcome.reason === "upstream_unavailable") {
      return NextResponse.json(
        { error: "Feedback extraction is temporarily unavailable" },
        { status: 502 }
      );
    }
    return NextResponse.json(
      { error: "Internal contract violation", issues: outcome.issues },
      { status: 500 }
    );
  }

  return NextResponse.json(outcome.record, { status: 201 });
}

export async function GET() {
  return NextResponse.json(listRecords());
}
