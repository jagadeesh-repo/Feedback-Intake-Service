# Plan

## Scope

Build the service the brief describes: freeform text → one AI call → structured content → checked against a contract → in-memory store → a typed API → a minimal dashboard.

**In scope:**

- A Zod contract for `FeedbackRecord`, checked at the request boundary and the AI-output boundary.
- One Anthropic (Claude) call per submission — mocked by default, real call opt-in with `USE_REAL_AI=true`.
- Retry once, then flag, when the model's output doesn't fit the contract.
- A typed API — submit, list, get-one — backed by an in-memory store.
- A minimal dashboard: the records plus counts by category.
- The two Gherkin scenarios below, as executable Cucumber tests — one written test-first.
- A CDK description of the target AWS shape (not deployed).

**Out of scope** (non-goals I stayed inside): auth, real deployment, a real database, exhaustive test coverage, UI polish, CI, containers, an observability stack.

## Assumptions

- **AI provider: Anthropic (Claude).** The brief left the provider to me.
- **Feedback is short, freeform, English text** — a sentence or a paragraph, as the brief describes.
- **One AI call per submission is enough** — a single extraction, not a multi-step pipeline.
- **Category is a small fixed list the model picks from**, not a free-form label (the reasoning is in DECISIONS.md).
- **The dashboard's aggregate is counts by category** — the brief offered a few options; I picked this one.
- **Single instance** — the in-memory store lives in one process, so there's no horizontal scaling.

## Risks

- The model can return well-formed JSON that still breaks the contract (wrong category, missing field). The retry-then-flag gate handles this.
- One retry might not be enough for a truly broken response. I accepted that — the flagged status keeps the failure visible instead of hidden.
- The in-memory store loses everything on restart. Fine here, since the brief expects in-memory.

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

These two scenarios are implemented as executable Cucumber tests in `features/`. The second was written and committed before its implementation existed (test-first) — see the commit history.
