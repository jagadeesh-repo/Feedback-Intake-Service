import { describe, it, expect } from "vitest";
import { FeedbackContentSchema, FeedbackRecordSchema, SubmitFeedbackRequestSchema } from "./schema";

describe("FeedbackContentSchema", () => {
  it("accepts a valid content payload", () => {
    const result = FeedbackContentSchema.safeParse({
      category: "bug",
      sentiment: "negative",
      severity: "high",
      summary: "Login button does nothing on Safari",
      suggestedAction: "Reproduce on Safari and check the click handler binding",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a payload with an invalid category", () => {
    const result = FeedbackContentSchema.safeParse({
      category: "not_a_real_category",
      sentiment: "negative",
      severity: "high",
      summary: "Login button does nothing on Safari",
      suggestedAction: "Reproduce on Safari and check the click handler binding",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a payload missing required fields", () => {
    const result = FeedbackContentSchema.safeParse({ category: "bug" });
    expect(result.success).toBe(false);
  });
});

describe("FeedbackRecordSchema", () => {
  it("accepts a full valid record", () => {
    const result = FeedbackRecordSchema.safeParse({
      id: "fb_01ARZ3NDEKTSV4RRFFQ69G5FAV",
      submittedAt: new Date().toISOString(),
      category: "bug",
      sentiment: "negative",
      severity: "high",
      summary: "Login button does nothing on Safari",
      suggestedAction: "Reproduce on Safari and check the click handler binding",
      status: "new",
      rawText: "the login button does nothing when I click it",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an id that isn't fb_-prefixed", () => {
    const result = FeedbackRecordSchema.safeParse({
      id: "not-a-valid-id",
      submittedAt: new Date().toISOString(),
      category: "bug",
      sentiment: "negative",
      severity: "high",
      summary: "x",
      suggestedAction: "x",
      status: "new",
      rawText: "x",
    });
    expect(result.success).toBe(false);
  });
});

describe("SubmitFeedbackRequestSchema", () => {
  it("accepts non-empty text", () => {
    const result = SubmitFeedbackRequestSchema.safeParse({ text: "the app is slow" });
    expect(result.success).toBe(true);
  });

  it("rejects empty text", () => {
    const result = SubmitFeedbackRequestSchema.safeParse({ text: "" });
    expect(result.success).toBe(false);
  });
});
