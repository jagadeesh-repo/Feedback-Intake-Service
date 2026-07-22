import { ulid } from "ulid";

export function generateFeedbackId(): string {
  return `fb_${ulid()}`;
}
