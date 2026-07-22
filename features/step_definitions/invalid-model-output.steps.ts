import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { extractFeedbackContent, type ExtractionResult } from "../../lib/ai-extract";

let callCount = 0;
let result: ExtractionResult;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function alwaysInvalidModelCaller(_text: string): Promise<unknown> {
  callCount += 1;
  return Promise.resolve({ not: "a valid content payload" });
}

Given("the AI model always returns content that fails the FeedbackRecord contract", function () {
  callCount = 0;
});

When("the feedback {string} is processed", async function (text: string) {
  result = await extractFeedbackContent(text, alwaysInvalidModelCaller);
});

Then("the model is called exactly 2 times", function () {
  assert.equal(callCount, 2);
});

Then("the resulting extraction is flagged as failed", function () {
  assert.equal(result.status, "extraction_failed");
});

Then("the failure is visible rather than silently defaulted", function () {
  assert.equal(result.status, "extraction_failed");
  if (result.status === "extraction_failed") {
    assert.ok(result.error.length > 0);
    assert.ok(result.rawOutput !== undefined);
  }
});
