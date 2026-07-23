import { ulid } from "ulid";

/** Generates a record id in the `fb_<ULID>` format the FeedbackRecord contract requires. */
export function generateFeedbackId(): string {
  return `fb_${ulid()}`;
}
