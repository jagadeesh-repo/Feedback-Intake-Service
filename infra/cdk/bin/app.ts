#!/usr/bin/env node
import { App } from "aws-cdk-lib";
import { FeedbackIntakeStack } from "../lib/feedback-intake-stack";

const app = new App();
new FeedbackIntakeStack(app, "FeedbackIntakeStack");
