import type { FeedbackRecord } from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __feedbackStore: Map<string, FeedbackRecord> | undefined;
}

const records = globalThis.__feedbackStore ?? new Map<string, FeedbackRecord>();
globalThis.__feedbackStore = records;

export function saveRecord(record: FeedbackRecord): FeedbackRecord {
  records.set(record.id, record);
  return record;
}

export function getRecord(id: string): FeedbackRecord | undefined {
  return records.get(id);
}

export function listRecords(): FeedbackRecord[] {
  return Array.from(records.values()).sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
}

export function clearStore(): void {
  records.clear();
}
