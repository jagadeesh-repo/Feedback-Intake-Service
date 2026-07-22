import { Stack, type StackProps, Duration } from "aws-cdk-lib";
import type { Construct } from "constructs";
import { Table, AttributeType, BillingMode } from "aws-cdk-lib/aws-dynamodb";
import { Function, Runtime, Code } from "aws-cdk-lib/aws-lambda";
import { HttpApi, HttpMethod } from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";

/**
 * Target production shape for the Feedback Intake Service, described only — not deployed
 * (per the exercise brief). HTTP API Gateway -> Lambda -> DynamoDB, with a log group for
 * basic operational visibility. Deliberately limited to these constructs: no VPC, no custom
 * domain, nothing beyond what's needed to describe a working, minimal path to AWS.
 */
export class FeedbackIntakeStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const table = new Table(this, "FeedbackTable", {
      partitionKey: { name: "id", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    const logGroup = new LogGroup(this, "FeedbackApiLogGroup", {
      retention: RetentionDays.ONE_WEEK,
    });

    const handler = new Function(this, "FeedbackApiHandler", {
      runtime: Runtime.NODEJS_20_X,
      handler: "index.handler",
      // Illustrative path — this stack is described, not synthesized/deployed; no Lambda bundle is built in this exercise.
      code: Code.fromAsset("../../dist/lambda"),
      timeout: Duration.seconds(10),
      environment: {
        TABLE_NAME: table.tableName,
      },
      logGroup,
    });
    table.grantReadWriteData(handler);

    const httpApi = new HttpApi(this, "FeedbackHttpApi");
    const integration = new HttpLambdaIntegration("FeedbackIntegration", handler);

    httpApi.addRoutes({ path: "/api/feedback", methods: [HttpMethod.POST, HttpMethod.GET], integration });
    httpApi.addRoutes({ path: "/api/feedback/{id}", methods: [HttpMethod.GET], integration });
  }
}
