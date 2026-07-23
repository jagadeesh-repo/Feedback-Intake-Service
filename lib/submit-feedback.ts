import { FeedbackRecordSchema, type FeedbackRecord } from "./schema";
import { extractFeedbackContent } from "./ai-extract";
import { generateFeedbackId } from "./id";
import { saveRecord } from "./store";

/**
 * Outcome of turning a piece of freeform feedback text into a stored record.
 *
 * `ok` — the record was assembled, validated, and stored (this includes the
 *   `extraction_failed` case: a flagged record is still a successfully stored
 *   record, just one whose content the model couldn't produce).
 * `upstream_unavailable` — the model could not be reached at all (network
 *   failure, missing/invalid API key, non-200). Distinct from a bad *response*,
 *   which is handled inside the retry-then-flag gate and still yields `ok`.
 * `contract_violation` — the assembled record failed its own schema check. A
 *   defensive "should never happen" case guarding against a bug in assembly.
 */
export type SubmitOutcome =
  | { ok: true; record: FeedbackRecord }
  | { ok: false; reason: "upstream_unavailable" }
  | { ok: false; reason: "contract_violation"; issues: unknown };

/**
 * Core submit path shared by the typed API route and the dashboard's server
 * action, so both go through exactly one implementation of extract → assemble
 * → validate → store. Callers map the outcome to their own surface (HTTP status
 * codes for the API, a page refresh for the form).
 *
 * `modelCaller` is injectable only to make the upstream-failure path testable;
 * it defaults to the real/mocked model call.
 */
export async function createFeedbackRecord(
  text: string,
  modelCaller?: (text: string) => Promise<unknown>
): Promise<SubmitOutcome> {
  let extraction;
  try {
    extraction = modelCaller
      ? await extractFeedbackContent(text, modelCaller)
      : await extractFeedbackContent(text);
  } catch {
    return { ok: false, reason: "upstream_unavailable" };
  }

  const submittedAt = new Date().toISOString();
  const id = generateFeedbackId();

  const recordCandidate =
    extraction.status === "ok"
      ? {
          id,
          submittedAt,
          status: "new" as const,
          rawText: text,
          ...extraction.content,
        }
      : {
          id,
          submittedAt,
          status: "extraction_failed" as const,
          rawText: text,
          category: "other" as const,
          sentiment: "neutral" as const,
          severity: "low" as const,
          summary: "Extraction failed — see extractionError.",
          suggestedAction: "Review manually.",
          extractionError: extraction.error,
        };

  const parsed = FeedbackRecordSchema.safeParse(recordCandidate);
  if (!parsed.success) {
    return { ok: false, reason: "contract_violation", issues: parsed.error.issues };
  }

  saveRecord(parsed.data);
  return { ok: true, record: parsed.data };
}
