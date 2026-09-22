# Feedback Intake Service

A small service that takes freeform feedback text, extracts a structured summary via an AI model, validates it against a contract, stores it, and exposes it through a typed API and a minimal dashboard.

## How it works

Freeform text is validated at every boundary before it's trusted. The three ①②③ below are the Zod validation boundaries — nothing untrusted (the request body, the model's output) reaches the store without passing a contract, and the model owns only the content fields while our code owns the record's shape.

```text
   [ Dashboard form ]        [ POST /api/feedback ]
            \                        /
             ▼                      ▼
    ┌────────────────────────────────────┐
    │ ①  Zod — request boundary          │  SubmitFeedbackRequestSchema
    │    empty / oversized text  → 400    │
    └─────────────────┬──────────────────┘
                      ▼
    ┌────────────────────────────────────┐
    │ AI extraction — one model call      │  mocked unless USE_REAL_AI=true
    │ extractJson: model text → object    │ 
    └─────────────────┬──────────────────┘
                      ▼
    ┌────────────────────────────────────┐
    │ ②  Zod — AI-output boundary        │  FeedbackContentSchema
    │    invalid → retry once → flag      │  → status "extraction_failed" (still stored)
    └─────────────────┬──────────────────┘
                      ▼
    ┌────────────────────────────────────┐
    │ assemble record                     │  code owns id / submittedAt / status
    │ (model owns content fields only)    │
    └─────────────────┬──────────────────┘
                      ▼
    ┌────────────────────────────────────┐
    │ ③  Zod — internal contract check   │  FeedbackRecordSchema
    │    defensive, before store → 500    │
    └─────────────────┬──────────────────┘
                      ▼
    ┌────────────────────────────────────┐
    │ in-memory store (globalThis)        │  → 201 Created
    └─────────────────┬──────────────────┘
                      ▼
   GET /api/feedback · /api/feedback/:id (404 if absent) · dashboard (table + counts)
```

## Requirements

- Node.js 20+
- npm

## Setup

```bash
npm install
## for linux/macos
cp .env.example .env.local 
## for windows
copy .env.example .env.local
```

## Running it

```bash
npm run dev
```

Visit `http://localhost:3000` for the dashboard — it has a form to submit feedback and shows the stored records plus a counts-by-category view. The same submit path is also available as a typed API under `http://localhost:3000/api/feedback` (see "Trying the API manually" below).

**By default, the AI extraction call is mocked** — no API key required, and the service runs fully offline. Every submission returns a fixed mock content payload (see "How it works" above for where this sits in the flow).

To use a real Anthropic call instead, set in `.env.local`:

```
USE_REAL_AI=true
ANTHROPIC_API_KEY=sk-ant-...
```

The model is configurable via `ANTHROPIC_MODEL` (defaults to `claude-sonnet-5` if unset).

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

Submitting feedback sends a JSON body, and shell quoting rules differ by platform — use the form that matches your shell.

**Linux / macOS (bash / zsh):**

```bash
curl -X POST http://localhost:3000/api/feedback \
  -H "content-type: application/json" \
  -d '{"text": "The export button does nothing when I click it on Safari"}'
```

**Windows — Command Prompt (cmd.exe):**

```bat
curl -X POST http://localhost:3000/api/feedback -H "content-type: application/json" -d "{\"text\": \"The export button does nothing when I click it on Safari\"}"
```

**Windows — PowerShell** (here `curl` is an alias for `Invoke-WebRequest`, so use `Invoke-RestMethod`):

```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/feedback -Method Post -ContentType "application/json" -Body '{"text": "The export button does nothing when I click it on Safari"}'
```

List all records and fetch one by id have no body, so the same command works in bash and cmd (in PowerShell use `curl.exe` instead of `curl`, or just open the URL in a browser):

```bash
# List all records
curl http://localhost:3000/api/feedback

# Get one record (replace :id with an id from the list above)
curl http://localhost:3000/api/feedback/:id
```

## What's stubbed

- The AI extraction call is mocked by default (see above) — a deliberate default, not an oversight.
- The store is in-memory only; all data is lost when the dev server restarts.

The `invalid-model-output` Cucumber scenario (`npm run test:bdd`) proves the extraction-failure path as an executable, test-first specification.

## Project docs

- `PLAN.md` — scope, risks, acceptance criteria (Gherkin).
- `HARDENING.md` — what was tightened, what was correctly left out.
- `DECISIONS.md` — key choices, known limitations, and where AI drove implementation vs. where the calls were made directly.
- `infra/cdk/` — AWS CDK description of the target production shape (API Gateway → Lambda → DynamoDB).
