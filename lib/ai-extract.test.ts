import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { callModel, parseContent, extractJson } from "./ai-extract";

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

describe("extractJson", () => {
  const payload = {
    category: "bug",
    sentiment: "negative",
    severity: "high",
    summary: "Export button does nothing",
    suggestedAction: "Check the click handler",
  };

  it("parses clean JSON", () => {
    expect(extractJson(JSON.stringify(payload))).toEqual(payload);
  });

  it("parses a ```json-fenced block (the real Claude failure case)", () => {
    const fenced = "```json\n" + JSON.stringify(payload) + "\n```";
    expect(extractJson(fenced)).toEqual(payload);
  });

  it("parses a bare ```-fenced block", () => {
    const fenced = "```\n" + JSON.stringify(payload) + "\n```";
    expect(extractJson(fenced)).toEqual(payload);
  });

  it("extracts a JSON object embedded in surrounding prose", () => {
    const withProse = "Here is the extracted feedback:\n" + JSON.stringify(payload) + "\nHope that helps!";
    expect(extractJson(withProse)).toEqual(payload);
  });

  it("returns the raw string when nothing parses, so downstream validation flags it", () => {
    expect(extractJson("I could not process that request.")).toBe("I could not process that request.");
  });
});
