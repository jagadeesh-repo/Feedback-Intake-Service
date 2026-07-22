import { describe, it, expect, beforeEach } from "vitest";
import { saveRecord, getRecord, listRecords, clearStore } from "./store";
import type { FeedbackRecord } from "./schema";

function makeRecord(overrides: Partial<FeedbackRecord> = {}): FeedbackRecord {
  return {
    id: "fb_01ARZ3NDEKTSV4RRFFQ69G5FAV",
    submittedAt: new Date().toISOString(),
    category: "bug",
    sentiment: "negative",
    severity: "medium",
    summary: "Test summary",
    suggestedAction: "Test action",
    status: "new",
    rawText: "test feedback",
    ...overrides,
  };
}

describe("store", () => {
  beforeEach(() => {
    clearStore();
  });

  it("saves and retrieves a record by id", () => {
    const record = makeRecord();
    saveRecord(record);
    expect(getRecord(record.id)).toEqual(record);
  });

  it("returns undefined for an unknown id", () => {
    expect(getRecord("fb_does_not_exist")).toBeUndefined();
  });

  it("lists records newest first", () => {
    const older = makeRecord({ id: "fb_00000000000000000000000000", submittedAt: "2026-01-01T00:00:00.000Z" });
    const newer = makeRecord({ id: "fb_11111111111111111111111111", submittedAt: "2026-06-01T00:00:00.000Z" });
    saveRecord(older);
    saveRecord(newer);
    const all = listRecords();
    expect(all.map((r) => r.id)).toEqual([newer.id, older.id]);
  });

  it("returns an empty list when nothing has been saved", () => {
    expect(listRecords()).toEqual([]);
  });
});
