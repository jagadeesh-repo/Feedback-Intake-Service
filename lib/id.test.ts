import { describe, it, expect } from "vitest";
import { generateFeedbackId } from "./id";

describe("generateFeedbackId", () => {
  it("returns an id prefixed with fb_", () => {
    const id = generateFeedbackId();
    expect(id.startsWith("fb_")).toBe(true);
  });

  it("returns a 26-character ULID after the prefix", () => {
    const id = generateFeedbackId();
    expect(id.slice(3)).toHaveLength(26);
  });

  it("returns unique ids across calls", () => {
    const a = generateFeedbackId();
    const b = generateFeedbackId();
    expect(a).not.toBe(b);
  });
});
