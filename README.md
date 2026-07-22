# Feedback Intake Service

A small service that takes freeform feedback text, extracts a structured summary via an AI model, validates it against a contract, stores it, and exposes it through a typed API and a minimal dashboard. Built for the Evinova Full-Stack Engineering Exercise.

## Requirements

- Node.js 20+
- npm

## Setup

```bash
npm install
cp .env.example .env.local
```

## Running it

```bash
npm run dev
```

Visit `http://localhost:3000` for the dashboard. The API is available under `http://localhost:3000/api/feedback`.

**By default, the AI extraction call is mocked** — no API key required, and the service runs fully offline. Every submission returns a fixed mock content payload; this is enough to exercise the full contract → store → API → dashboard path without any external dependency.

To use a real Anthropic call instead, set in `.env.local`:

```
USE_REAL_AI=true
ANTHROPIC_API_KEY=sk-ant-...
```

## Running the tests

**Cucumber (the two acceptance scenarios from PLAN.md):**

```bash
npm run test:bdd
```

**Unit tests (schema, store, id generation, mock AI path):**

```bash
npm run test
```

## Trying the API manually

```bash
# Submit feedback
curl -X POST http://localhost:3000/api/feedback \
  -H "content-type: application/json" \
  -d '{"text": "The export button does nothing when I click it on Safari"}'

# List all records
curl http://localhost:3000/api/feedback

# Get one record (replace :id with an id from the list above)
curl http://localhost:3000/api/feedback/:id
```

## What's stubbed

- The AI extraction call is mocked by default (see above) — a deliberate default, not an oversight.
- The store is in-memory only; all data is lost when the dev server restarts.

## Project docs

- `PLAN.md` — scope, risks, acceptance criteria (Gherkin).
- `HARDENING.md` — what was tightened, what was correctly left out for a 4-5 hour exercise, and why.
- `DECISIONS.md` — key choices, known limitations, and where AI drove implementation vs. where the calls were made directly.
- `infra/cdk/` — AWS CDK description of the target production shape (API Gateway → Lambda → DynamoDB). Not deployed.
