# Decisions

## Key choices and why

- **Single Next.js app (API + dashboard together)** rather than a separate backend/frontend. Given the 4-5 hour budget, this halves scaffolding time and plays to my strongest stack without being a corner-cut — the CDK write-up still describes a different target production shape (API Gateway → Lambda → DynamoDB) that the local dev setup doesn't need to mirror 1:1.
- **Mock-by-default AI call, real call opt-in via `USE_REAL_AI=true`.** Protects anyone running this locally without an Anthropic API key, and protects a live demo from an API outage or rate limit.
- **Retry-once-then-flag on invalid model output**, rather than retry-until-success or silently defaulting to plausible-looking content. A single retry absorbs ordinary model flakiness; flagging (rather than faking a default) means a failure is always visible in the data, never hidden. This mirrors a guardrail pattern I run in production for an AI concierge I built and operate (Zod-validated outputs with a visible failure state) — informal production instinct, not a formal eval harness.
- **`extractFeedbackContent` takes an injectable model-caller function** (defaulting to the real `callModel`). This is what makes the retry-then-flag behavior testable without mocking modules — the Cucumber step definitions inject a fake caller that always returns invalid content, rather than reaching into the Anthropic SDK's internals.
- **`extraction_failed` records still populate every content field** with clear placeholder values (rather than leaving them absent), so every stored record satisfies the same `FeedbackRecordSchema` regardless of outcome — the failure signal lives in `status` and `extractionError`, not in an inconsistent record shape.
- **Schema extensions beyond the reference shape:** added `rawText` (the original submission, useful for triage and for reprocessing) and `extractionError` (populated only when `status === "extraction_failed"`, holds the validation error for debugging). Both are additive and don't change the reference fields' meaning.
- **Dashboard reads the in-memory store directly** rather than calling its own API route over HTTP. In a single-process dev server, a self-referential HTTP call adds complexity (needing an absolute base URL) for no real benefit — the API is still fully typed and independently exercised by the Cucumber scenarios and the documented curl checks in the README.
- **The store is backed by `globalThis`, not a plain module-level `const`.** Building the dashboard surfaced a real bug: Next.js's Turbopack dev bundler gives the page (a React Server Component) and the API route handlers separate module instances of `lib/store.ts` — a plain `const records = new Map()` was silently two different Maps, so records created via the API never appeared on the dashboard. Reproduced with curl (submit → list confirms the record exists → dashboard still shows empty), root-caused by instrumenting the store to confirm two distinct Map instances, then fixed with the standard Next.js-ecosystem pattern for this exact class of problem (the same technique used for Prisma Client / Redis singletons surviving dev-mode module duplication): key the Map off `globalThis` so every bundle resolves to the same instance. Verified fixed end-to-end (dashboard reflects a submission immediately, no restart needed) and verified the fix doesn't leak state across a full server restart (still correctly empty on fresh start, preserving the in-memory non-goal). The dashboard page also needed `export const dynamic = "force-dynamic"` alongside the store fix — without it, the page could still be statically cached and not re-execute per request even with a correctly shared store.
- **Cucumber over a Vitest-Gherkin plugin.** The brief specifically names Cucumber as the example Gherkin runner; using the actual standard tool is more defensible than a lesser-known plugin, and it's genuine hands-on use of a tool previously only understood in theory.

## Known limitations

- In-memory store: all data is lost on restart. Expected and scoped by the brief.
- Only one retry on invalid model output — a second consecutive failure is treated as final. A more resilient system might vary the re-prompt strategy or fall back to a different model.
- No automated coverage of the API routes themselves (only the extraction/contract logic, which is where the two required scenarios live) — verified manually via the curl commands in the README instead, per the brief's explicit instruction not to chase broad coverage.

## What I'd do with more time

- Add the CI/observability/rate-limiting items listed in HARDENING.md.
- Extend the dashboard with a status filter and a resolve/triage action, since `status` already models that lifecycle.
- Add a second model provider as a failover path — a pattern already used in a live production system (cost-ceiling failover on an AI concierge), and a natural extension of the retry logic already here.

## Where AI helped vs where I decided

AI (Claude, via Claude Code) accelerated typing throughout — boilerplate for the Zod schemas, the Next.js route handlers, the Cucumber step-definition scaffolding, and this document's prose. The decisions it did not make: the retry-once-then-flag strategy and why (vs. retry-until-success or a silent default); the single-Next.js-app architecture call and its trade-off against a split backend/frontend; which schema fields to add and why; the choice of Cucumber over alternatives; the decision to keep the dashboard reading the store directly instead of round-tripping through the API; and the CDK construct list kept deliberately small rather than reaching for services I'd have to fake depth on live.
