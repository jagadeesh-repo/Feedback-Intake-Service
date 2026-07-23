# Hardening

## What was tightened

- **Invalid-model-output gate:** the model's response is validated against the content-only contract before it's trusted. On failure, one identical retry (absorbs transient model flakiness — not a corrective re-prompt; the retry doesn't feed the prior failure back into the second attempt); if that also fails, the record is stored with `status: "extraction_failed"` and the raw model output preserved in `extractionError` rather than silently defaulted to plausible-looking fake content. Failure is visible in both the API and the dashboard.
- **Tolerant response parsing (`extractJson`):** models routinely wrap JSON in markdown fences (` ```json … ``` `) or add a sentence of prose despite being told not to. Rather than `JSON.parse`-ing the raw text (which throws on a leading backtick and would bypass the gate as an unhandled 500), the response is run through progressively looser strategies — direct parse, fenced-block extraction, first-`{`-to-last-`}` extraction — and if none parse, the raw text is returned so it fails schema validation and flows through the same retry-then-flag path. A malformed response is treated as a contract problem, not a crash.
- **Upstream-failure isolation:** a bad *response* (unparseable or schema-invalid content) is flagged and stored; a thrown error means the model could not be reached at all (network failure, missing/invalid API key, non-200). Those are semantically different, so the submit route catches the latter and returns a `502` rather than fabricating an `extraction_failed` record or crashing with a `500` — an outage is surfaced as an outage.
- **Request-boundary validation:** the submit endpoint validates the incoming body against `SubmitFeedbackRequestSchema` before doing anything else — empty or oversized text is rejected with a 400, not passed to the model.
- **Internal contract check:** even after extraction succeeds, the assembled record is re-validated against the full `FeedbackRecord` schema before being stored — a defensive check against a future bug in the assembly code, not just the model's output.
- **Not-found handling:** requesting an unknown record id returns a 404, not a 500 or an unhandled exception.
- **Duplicate-submission guard:** while a submission is in flight, the dashboard's submit button disables itself and shows a pending state (via the form's `useFormStatus`), so a slow round-trip can't be turned into duplicate records by an impatient double-click.

## What was correctly left out, and why

- **CI gates** — no pipeline runs the tests on push. Correctly out of scope for a 4-5 hour local exercise; the test suite runs manually and is documented in the README.
- **End-to-end tests** — the two Gherkin scenarios exercise the extraction/contract logic directly, which is where the interesting behavior lives. Browser-level e2e tests would mostly re-test Next.js routing, not this service's logic — not a good use of a tightly scoped time budget.
- **Promotion with approvals and rollback** — nothing is deployed, so there's nothing to promote or roll back. Addressed narratively in the CDK write-up instead, since that's where it would actually apply.
- **Observability (logging/metrics/tracing)** — a single in-memory service with no deployment has no operational surface to observe yet. Before this went near production, the first investment would be structured logging around the AI call (latency, retry count, failure rate), not a generic logging library.
- **Rate limiting / cost controls on the AI call** — genuinely worth having before production, left out here because the exercise explicitly scopes to a single call path with no auth, so there's no realistic abuse surface yet.
- **Guaranteed-structured model output (tool use / structured outputs)** — the current approach asks for JSON in the prompt and parses defensively (see `extractJson` above), which is robust to fences and prose. The stronger production move is to stop relying on the model's free-form text at all: use Anthropic tool-use / structured-output so the provider returns schema-shaped JSON by construction. Left out here because the defensive parse is proportionate for a 4-5 hour exercise and keeps the single-call shape simple, but it's the next step that would make the malformed-output path rare rather than merely handled.

## What I'd add before production

1. CI running the Cucumber + Vitest suites on every PR, blocking merge on failure.
2. Structured logging on the AI call path (attempt count, latency, failure reason) — the first thing worth having visibility into, since it's the one call in the system with external, non-deterministic behavior.
3. A real datastore (the brief scoped in-memory; DynamoDB is already sketched in the CDK) with a migration path.
4. Auth on the submit endpoint, since it's currently open to anyone who can reach it.
5. A cap on retries and a circuit breaker if the AI provider is down, so a provider outage degrades gracefully instead of doubling every request's latency.
