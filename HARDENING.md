# Hardening

## What I tightened

- **Bad model output is caught, not trusted.** The response is checked against the schema. If it fails, I retry once; if it still fails, the record is stored marked `extraction_failed` with the raw output kept for reference. (The retry is just a second try — it doesn't feed the error back to the model.)

- **Messy-but-valid responses still work.** Models often wrap JSON in ```` ```json ```` fences or add a sentence around it. Instead of letting that crash the parse, `extractJson` tries a few ways to pull the JSON out. If nothing works, it passes the raw text on so the schema check flags it — a bad response is treated as bad data, never a crash.

- **"Bad output" and "model unreachable" are handled differently.** Bad output gets flagged and stored. But if the call itself fails (network, bad key, non-200), that's an outage, not a record — so the API returns a 502 instead of storing a fake failed record or throwing a 500.

- **Input is validated first.** Empty or oversized text is rejected with a 400 before the model is ever called.

- **The finished record is re-checked before saving.** Even after a good extraction, I validate the assembled record against the full schema — a guard against a bug in my own assembly code.

- **Unknown ids return 404**, not a crash.

- **No accidental double-submits.** While a submission is in flight, the submit button is disabled and shows a spinner, so an impatient double-click can't create duplicate records.

- **The store works the same across the page and the API.** In Next.js dev, the dashboard page and the API routes ended up with separate copies of the in-memory store, so records submitted through the API never showed on the page. I found it with curl — submit worked, the list showed the record, but the page stayed empty — and fixed it by keying the store off `globalThis`, the standard Next.js trick (the same one used for Prisma/Redis clients). The page also needs `dynamic = "force-dynamic"` so it re-runs on every request.

## What I left out, and why

- **CI** — overkill for a few-hour exercise. The tests run with one command (see the README).
- **Browser / end-to-end tests** — the two Gherkin tests already cover the interesting logic. E2E would mostly test Next.js routing, not this service.
- **Deploy promotion / rollback** — nothing is deployed. This belongs with the CDK, and I describe it there.
- **Logging / metrics / tracing** — a single in-memory service has nothing to observe yet. In production the first thing I'd add is logging around the AI call.
- **Rate limiting / cost caps** — worth having in production, but there's no auth and one call path here, so no real abuse surface.
- **Guaranteed-valid output (tool use / structured outputs)** — I ask for JSON in the prompt and parse defensively, which handles the messy cases. The stronger move is to have the model return schema-shaped JSON by construction, so bad output becomes rare instead of just handled. I kept the simpler approach for this exercise.

## What I'd add before production

1. CI running the tests on every PR.
2. Logging around the AI call — attempts, latency, failures — since it's the one non-deterministic part of the system.
3. A real database (DynamoDB is already sketched in the CDK).
4. Auth on the submit endpoint.
5. A retry cap and a circuit breaker for when the AI provider is down.
