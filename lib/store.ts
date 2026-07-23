import type { FeedbackRecord } from "./schema";

declare global {
  var __feedbackStore: Map<string, FeedbackRecord> | undefined;
}

// Back the store with globalThis so the dashboard (a Server Component) and the
// API route handlers resolve to the same Map instance. Next.js's dev bundler
// otherwise gives them separate module copies, and records created via the API
// would never appear on the dashboard.
const records = globalThis.__feedbackStore ?? new Map<string, FeedbackRecord>();
globalThis.__feedbackStore = records;

/** Inserts or replaces a record by id; returns the stored record. */
export function saveRecord(record: FeedbackRecord): FeedbackRecord {
  records.set(record.id, record);
  return record;
}

/** Returns the record with this id, or undefined if none exists. */
export function getRecord(id: string): FeedbackRecord | undefined {
  return records.get(id);
}

/** Returns all stored records, newest first (by submittedAt). */
export function listRecords(): FeedbackRecord[] {
  return Array.from(records.values()).sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
}

/** Removes every record. Used to isolate unit tests. */
export function clearStore(): void {
  records.clear();
}
