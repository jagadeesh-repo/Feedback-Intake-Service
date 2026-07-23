import { z } from "zod";

export const FeedbackCategory = z.enum([
  "praise",
  "complaint",
  "suggestion",
  "question",
  "bug",
  "other",
]);
export const FeedbackSentiment = z.enum(["positive", "neutral", "negative"]);
export const FeedbackSeverity = z.enum(["low", "medium", "high"]);
export const FeedbackStatus = z.enum(["new", "triaged", "resolved", "extraction_failed"]);

// The content fields the model produces. Everything else on a record
// (id, timestamp, status) is owned by our code, not the model.
export const FeedbackContentSchema = z.object({
  category: FeedbackCategory,
  sentiment: FeedbackSentiment,
  severity: FeedbackSeverity,
  summary: z.string().min(1).max(200),
  suggestedAction: z.string().min(1).max(300),
});
export type FeedbackContent = z.infer<typeof FeedbackContentSchema>;

// The full stored record: model-produced content plus the code-owned
// id, timestamp, status, and original rawText. The single source of truth
// validated at both the request boundary and the AI-output boundary.
export const FeedbackRecordSchema = z.object({
  id: z.string().regex(/^fb_[0-9A-HJKMNP-TV-Z]{26}$/, "id must be an fb_-prefixed ULID"),
  submittedAt: z.string().datetime(),
  category: FeedbackCategory,
  sentiment: FeedbackSentiment,
  severity: FeedbackSeverity,
  summary: z.string().min(1).max(200),
  suggestedAction: z.string().min(1).max(300),
  status: FeedbackStatus,
  rawText: z.string().min(1),
  extractionError: z.string().optional(),
});
export type FeedbackRecord = z.infer<typeof FeedbackRecordSchema>;

/** The inbound submit payload, validated at the request boundary before anything is sent to the model. */
export const SubmitFeedbackRequestSchema = z.object({
  text: z.string().min(1, "text must not be empty").max(5000, "text is too long"),
});
export type SubmitFeedbackRequest = z.infer<typeof SubmitFeedbackRequestSchema>;
