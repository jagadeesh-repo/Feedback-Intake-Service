# Decisions

Notes on the choices that weren't obvious, and why I made them.

## Key choices

- **One Next.js app for both the API and the dashboard.** With only a few hours, this was faster than splitting frontend and backend, and it's my strongest stack. The CDK sketch still describes the real production shape (API Gateway → Lambda → DynamoDB); the local setup doesn't need to match it.

- **The AI call is mocked by default; the real one is opt-in with `USE_REAL_AI=true`.** So it runs with no API key, and a live demo can't be broken by an outage or rate limit.

- **On bad model output: retry once, then flag.** If the model returns something that doesn't fit the schema, I try once more. If it still fails, the record is stored marked `extraction_failed`, with the raw output kept in `extractionError`. I don't retry forever or invent a plausible answer — a failure should be visible in the data, not hidden.

- **The model only owns the content fields.** Category, sentiment, severity, summary, and suggested action come from the model. The id, timestamp, and status are set by my code. I also added two fields the reference shape didn't have: `rawText` (the original text, so nothing is lost) and `extractionError` (why a record was flagged).

- **`extraction_failed` is a status value.** I added it to the reference set (`new`/`triaged`/`resolved`). It's arguably a different kind of thing — the others say where a record is in review, this one says whether the AI succeeded. I kept them in one enum for simplicity; in a bigger system I'd split it into a separate `extractionStatus` field so a human could still triage a failed record.

- **Broader categories, but still a fixed list.** The reference ones were software-specific (bug, feature_request, praise, other). I widened them to praise / complaint / suggestion / question / bug / other. I kept it a fixed list rather than a free-form label on purpose: a closed set is what makes the "counts by category" view meaningful and keeps the field something we can validate. Whatever the user actually wrote lives in the summary and suggested-action fields.

- **The dashboard reads the store directly, not over HTTP.** It's the same process, so calling my own API endpoint would just add complexity for no gain. The API is still fully typed and covered by the tests and the curl examples.

- **The store is keyed off `globalThis`.** This came from a real bug: in Next.js dev, the dashboard page and the API routes ended up with separate copies of the store, so records submitted through the API never showed on the page. I found it with curl (submit worked, the list showed the record, the page stayed empty) and fixed it with the standard Next.js trick for this — the same one used for Prisma/Redis clients. The page also needs `dynamic = "force-dynamic"` so it re-runs on every request.

- **Cucumber for the acceptance tests.** The brief named it as the example, so I used the real tool instead of a lookalike.

- **One shared submit function.** The API route and the dashboard form both go through `createFeedbackRecord`, so the extract → validate → store logic lives in one place. Each caller just handles the result its own way — HTTP status codes for the API, a page refresh for the form.

- **A submit form on the dashboard.** The brief only asked the dashboard to show records, but the product is about people submitting feedback, so a form felt more complete than a curl-only path. It's deliberately minimal: a textarea and a button, no extra polish.

## Known limitations

- The store is in-memory, so everything is lost on restart. This is what the brief asked for.
- Only one retry on bad output; a second failure in a row is treated as final.
- I didn't write tests for the API routes themselves — the two required tests cover the extraction and contract logic, and the routes are checked by hand with the curl commands in the README.

## With more time

- CI, logging, and rate limiting (see HARDENING.md).
- A resolve/triage action on the dashboard, since the status field already models that.
- A second model as a fallback if the first is down — a natural extension of the retry that's already there.

## Where AI helped, and where I decided

I used Claude (via Claude Code) to speed up the typing: schema boilerplate, route handlers, test scaffolding, and drafts of these docs. The judgment calls were mine — retry-then-flag over retrying forever or faking a default, one app instead of two, which fields to add, using the real Cucumber, reading the store directly, and keeping the CDK small rather than padding it with services I couldn't speak to.
