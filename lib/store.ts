import type { FeedbackRecord } from "./schema";

const records = new Map<string, FeedbackRecord>();

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
