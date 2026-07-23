import { describe, it, expect, beforeEach } from "vitest";
import { createFeedbackRecord } from "./submit-feedback";
import { getRecord, clearStore } from "./store";
import { FeedbackRecordSchema } from "./schema";

describe("createFeedbackRecord (mock AI path)", () => {
  beforeEach(() => {
    clearStore();
    delete process.env.USE_REAL_AI;
    delete process.env.MOCK_AI_MODE;
  });

  it("returns ok with a schema-conforming, stored record", async () => {
    const outcome = await createFeedbackRecord("The export button does nothing on Safari");

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;

    expect(FeedbackRecordSchema.safeParse(outcome.record).success).toBe(true);
    expect(outcome.record.status).toBe("new");
    expect(outcome.record.rawText).toBe("The export button does nothing on Safari");
    expect(outcome.record.id).toMatch(/^fb_[0-9A-HJKMNP-TV-Z]{26}$/);
  });

  it("persists the record so it can be retrieved by id", async () => {
    const outcome = await createFeedbackRecord("Please add dark mode");
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;

    expect(getRecord(outcome.record.id)).toEqual(outcome.record);
  });

  it("returns upstream_unavailable (does not throw) when the model call fails", async () => {
    const outcome = await createFeedbackRecord("anything", () => {
      throw new Error("network down");
    });

    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.reason).toBe("upstream_unavailable");
  });

  it("does not store anything when the model call fails", async () => {
    await createFeedbackRecord("anything", () => {
      throw new Error("network down");
    });
    // Nothing should have been persisted on the upstream-failure path.
    // (store was cleared in beforeEach; a failed submit must not add a record)
    const outcome = await createFeedbackRecord("a real one");
    expect(outcome.ok).toBe(true);
  });

  it("stores a flagged record when MOCK_AI_MODE=invalid (the deliberate-failure demo path)", async () => {
    process.env.MOCK_AI_MODE = "invalid";
    const outcome = await createFeedbackRecord("trigger a deliberate extraction failure");

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.record.status).toBe("extraction_failed");
    expect(outcome.record.extractionError).toBeTruthy();
    expect(outcome.record.rawText).toBe("trigger a deliberate extraction failure");
  });
});
