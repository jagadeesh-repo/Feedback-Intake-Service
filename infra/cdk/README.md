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

- **Deploy:** `npm install` in `infra/cdk`, `cdk bootstrap` once per account/region, then `cdk deploy`.
- **Promotion:** one stack per environment (dev / staging / prod), each its own deploy. Promoting means deploying the same code to the next environment — from CI (GitHub Actions or CDK Pipelines) rather than by hand.
- **Rollback:** CloudFormation rolls back automatically if a deploy fails. To undo a deploy that succeeded but was bad, redeploy the previous commit. For data, DynamoDB point-in-time recovery covers accidental writes or deletes.
