# Hardening

## What was tightened

- **Invalid-model-output gate:** the model's response is validated against the content-only contract before it's trusted. On failure, one retry with a corrective re-prompt; if that also fails, the record is stored with `status: "extraction_failed"` and the raw model output preserved in `extractionError` rather than silently defaulted to plausible-looking fake content. Failure is visible in both the API and the dashboard.
- **Request-boundary validation:** the submit endpoint validates the incoming body against `SubmitFeedbackRequestSchema` before doing anything else — empty or oversized text is rejected with a 400, not passed to the model.
- **Internal contract check:** even after extraction succeeds, the assembled record is re-validated against the full `FeedbackRecord` schema before being stored — a defensive check against a future bug in the assembly code, not just the model's output.
- **Not-found handling:** requesting an unknown record id returns a 404, not a 500 or an unhandled exception.

## What was correctly left out, and why

- **CI gates** — no pipeline runs the tests on push. Correctly out of scope for a 4-5 hour local exercise; the test suite runs manually and is documented in the README.
- **End-to-end tests** — the two Gherkin scenarios exercise the extraction/contract logic directly, which is where the interesting behavior lives. Browser-level e2e tests would mostly re-test Next.js routing, not this service's logic — not a good use of a tightly scoped time budget.
- **Promotion with approvals and rollback** — nothing is deployed, so there's nothing to promote or roll back. Addressed narratively in the CDK write-up instead, since that's where it would actually apply.
- **Observability (logging/metrics/tracing)** — a single in-memory service with no deployment has no operational surface to observe yet. Before this went near production, the first investment would be structured logging around the AI call (latency, retry count, failure rate), not a generic logging library.
- **Rate limiting / cost controls on the AI call** — genuinely worth having before production, left out here because the exercise explicitly scopes to a single call path with no auth, so there's no realistic abuse surface yet.
- **Network-level failure handling on the real AI path** — `extractFeedbackContent`'s calls to the model are not wrapped in a try/catch; a network error or Anthropic outage on the real-call path (`USE_REAL_AI=true`) would throw an unhandled rejection rather than degrade to the same `extraction_failed` state that a contract-violation gets. The mocked default path (what this repo runs by default) never hits this, so it wasn't exercised by the two required scenarios. Worth a `try/catch` around the model call, folding network failures into the same flagged-failure path as content-validation failures — the natural next hardening step.

## What I'd add before production

1. CI running the Cucumber + Vitest suites on every PR, blocking merge on failure.
2. Structured logging on the AI call path (attempt count, latency, failure reason) — the first thing worth having visibility into, since it's the one call in the system with external, non-deterministic behavior.
3. A real datastore (the brief scoped in-memory; DynamoDB is already sketched in the CDK) with a migration path.
4. Auth on the submit endpoint, since it's currently open to anyone who can reach it.
5. A cap on retries and a circuit breaker if the AI provider is down, so a provider outage degrades gracefully instead of doubling every request's latency.
