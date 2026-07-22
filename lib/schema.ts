import { z } from "zod";

export const FeedbackCategory = z.enum(["bug", "feature_request", "praise", "other"]);
export const FeedbackSentiment = z.enum(["positive", "neutral", "negative"]);
export const FeedbackSeverity = z.enum(["low", "medium", "high"]);
export const FeedbackStatus = z.enum(["new", "triaged", "resolved", "extraction_failed"]);

export const FeedbackContentSchema = z.object({
  category: FeedbackCategory,
  sentiment: FeedbackSentiment,
  severity: FeedbackSeverity,
  summary: z.string().min(1).max(200),
  suggestedAction: z.string().min(1).max(300),
});
export type FeedbackContent = z.infer<typeof FeedbackContentSchema>;

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

export const SubmitFeedbackRequestSchema = z.object({
  text: z.string().min(1, "text must not be empty").max(5000, "text is too long"),
});
export type SubmitFeedbackRequest = z.infer<typeof SubmitFeedbackRequestSchema>;
