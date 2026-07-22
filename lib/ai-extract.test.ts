import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { callModel, parseContent } from "./ai-extract";

describe("callModel (mock path)", () => {
  const originalEnv = process.env.USE_REAL_AI;

  beforeEach(() => {
    delete process.env.USE_REAL_AI;
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.USE_REAL_AI;
    } else {
      process.env.USE_REAL_AI = originalEnv;
    }
  });

  it("returns a mocked response when USE_REAL_AI is not set", async () => {
    const result = await callModel("The export button is broken");
    expect(result).toEqual({
      category: "other",
      sentiment: "neutral",
      severity: "low",
      summary: "Mocked summary of the feedback.",
      suggestedAction: "Mocked suggested action.",
    });
  });
});

describe("parseContent", () => {
  it("succeeds for a valid content payload", () => {
    const result = parseContent({
      category: "bug",
      sentiment: "negative",
      severity: "high",
      summary: "Export button does nothing",
      suggestedAction: "Check the click handler",
    });
    expect(result.success).toBe(true);
  });

  it("fails for a payload missing required fields", () => {
    const result = parseContent({ category: "bug" });
    expect(result.success).toBe(false);
  });
});
