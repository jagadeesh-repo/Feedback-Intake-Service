import { NextRequest, NextResponse } from "next/server";
import { getRecord } from "@/lib/store";

/** GET /api/feedback/:id — returns one record, or 404 if it doesn't exist. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const record = getRecord(id);
  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(record);
}
