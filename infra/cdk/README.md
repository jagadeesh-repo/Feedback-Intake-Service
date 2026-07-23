# Infrastructure (AWS CDK)

This describes how I'd run the service on AWS. It's here to read and talk through, not to deploy — per the brief. I haven't run `cdk deploy`, and it won't `synth` as-is (the Lambda points at a bundle that isn't built).

## The shape

`lib/feedback-intake-stack.ts` provisions a small serverless setup:

- **API Gateway (HTTP API) → Lambda → DynamoDB**, plus a CloudWatch log group.
- The DynamoDB table is keyed on `id` (matching the record) and pay-per-request, so it costs nothing when idle.
- The Lambda gets the table name as an env var and read/write access to the table via IAM.
- The routes match the app: `POST`/`GET /api/feedback` and `GET /api/feedback/{id}`.

## How a Next.js app actually fits here

A Next.js app isn't a plain Lambda handler, so you can't point Lambda straight at it. The realistic options are:

- **Vercel** — the simplest home for Next.js.
- **A container** (Next.js `standalone` output) on **App Runner** or **ECS Fargate**.
- **OpenNext on Lambda + CloudFront** — if you want the serverless shape above.

The CDK sketches the serverless target as the thing to discuss. In practice I'd probably reach for a container on App Runner, or OpenNext if serverless was the goal.

## Deploy, promotion, rollback

The stack is a single environment — promotion and rollback aren't built into it. That's fine for a describe-only sketch, but here's how each would actually work and what it would take.

**Deploy:** `npm install` here, `cdk bootstrap` once per account/region, then `cdk deploy`.

**Rollback — mostly free from the platform, not something I coded:**

- If a `cdk deploy` fails partway, CloudFormation rolls the stack back to the last good state on its own.
- To undo a deploy that succeeded but shipped a bug: the infra is just versioned code, so `git revert` the change and `cdk deploy` again — that redeploys the previous template.
- For data, the DynamoDB table has point-in-time recovery turned on, so accidental writes or deletes can be restored to any second in the last 35 days.

**Promotion — this is the part that needs real code, and isn't here yet:**

- Today `bin/app.ts` creates one stack. I'd parameterise it per environment (dev / staging / prod) — either instantiate the stack once per env config, or use CDK Pipelines, which builds the app once and promotes that same artifact through the stages with a manual approval gate before prod.
