import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { extractFeedbackContent } from "../../lib/ai-extract";
import { FeedbackRecordSchema, type FeedbackRecord } from "../../lib/schema";
import { generateFeedbackId } from "../../lib/id";

let feedbackText: string;
let resultingRecord: FeedbackRecord;

Given("a user submits the feedback text {string}", function (text: string) {
  feedbackText = text;
});

When("the feedback is processed", async function () {
  const extraction = await extractFeedbackContent(feedbackText);
  assert.equal(extraction.status, "ok", "expected extraction to succeed for this scenario");
  if (extraction.status !== "ok") return;

  resultingRecord = {
    id: generateFeedbackId(),
    submittedAt: new Date().toISOString(),
    status: "new",
    rawText: feedbackText,
    ...extraction.content,
  };
});

Then("the resulting record conforms to the FeedbackRecord contract", function () {
  const result = FeedbackRecordSchema.safeParse(resultingRecord);
  assert.equal(result.success, true, result.success ? "" : JSON.stringify(result.error.issues));
});

Then(
  "the record's category, sentiment, severity, summary, and suggested action come from the model",
  function () {
    assert.ok(resultingRecord.category);
    assert.ok(resultingRecord.sentiment);
    assert.ok(resultingRecord.severity);
    assert.ok(resultingRecord.summary);
    assert.ok(resultingRecord.suggestedAction);
  }
);
