# Plan

## Scope

Build the Feedback Intake Service exactly as scoped in the brief: freeform text → one AI call → structured content → Zod-validated contract → in-memory store → typed API → minimal dashboard.

**In scope:**
- Zod contract for `FeedbackRecord`, validated at the request boundary and the AI-output boundary.
- One Anthropic Claude call per submission (mocked by default, real call opt-in via `USE_REAL_AI=true`).
- Retry-once-then-flag handling when the model's output fails the contract.
- Typed API: submit, list, get-one. In-memory store.
- Minimal dashboard: record list + counts-by-category.
- Two Gherkin scenarios (below), implemented as executable Cucumber tests; one committed test-first.
- CDK description of the target AWS shape (not deployed).

**Out of scope (non-goals, respected as hard boundaries):** auth, real deployment, persistence beyond in-memory, exhaustive test coverage, UI polish/theming, CI, containerization, observability stack.

## Risks

- The model can return well-formed JSON that still fails the contract (wrong enum value, missing field) — handled by the retry-then-flag gate below.
- A single retry may not be enough for a genuinely malformed prompt/response pairing — accepted risk for this scope; the flagged status makes the failure visible rather than silent.
- In-memory store means all data is lost on restart — acceptable per the brief's own instruction that in-memory is expected.

## Acceptance criteria (Gherkin)

### Scenario: A valid submission produces a conforming record

```gherkin
Given a user submits the feedback text "The export button does nothing when I click it on Safari"
When the feedback is processed
Then the resulting record conforms to the FeedbackRecord contract
And the record's category, sentiment, severity, summary, and suggested action come from the model
```

### Scenario: The model returns content that does not satisfy the contract

```gherkin
Given the AI model always returns content that fails the FeedbackRecord contract
When the feedback "This is fine I guess" is processed
Then the model is called exactly 2 times
And the resulting extraction is flagged as failed
And the failure is visible rather than silently defaulted
```

These two scenarios are implemented as executable Cucumber tests in `features/`. The second scenario was written and committed before its implementation existed (test-first) — see commit history.
