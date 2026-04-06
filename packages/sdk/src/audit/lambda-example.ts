/**
 * Lambda adapter example — shows how the same audited operation pattern
 * works outside NestJS in a serverless function.
 *
 * This is NOT a deployable Lambda. It demonstrates the runtime-agnostic design.
 *
 * In a real deployment:
 * - The AuditWriter would write to DynamoDB or CloudWatch
 * - The ExecutionContext would be built from the Lambda event
 * - The business logic would be the same reusable function
 */

import {
  createExecutionContext,
  executeAuditedOperation,
  type AuditWriter,
  type ExecutionContext,
} from "./index";

/**
 * Example: In-memory audit writer for Lambda (replace with DynamoDB/CloudWatch)
 */
class LambdaAuditWriter implements AuditWriter {
  readonly events: Array<{ requestId: string; eventType: string }> = [];

  async record(
    requestId: string,
    _tenantId: string,
    _sourceService: string,
    event: { eventType: string },
  ): Promise<void> {
    this.events.push({ requestId, eventType: event.eventType });
    // In production: write to DynamoDB, CloudWatch Logs, or SQS
    console.log(
      JSON.stringify({ level: "info", requestId, eventType: event.eventType }),
    );
  }
}

/**
 * Example Lambda handler using the audited operation pattern.
 */
export async function handler(event: {
  actionType: string;
  resourceId: string;
  userId?: string;
}) {
  const writer = new LambdaAuditWriter();

  const ctx: ExecutionContext = createExecutionContext({
    operationName: "lambda.process-action",
    tenantId: "default",
    sourceService: "action-processor-lambda",
    principal: event.userId
      ? { sub: event.userId, principalType: "user" }
      : null,
  });

  const result = await executeAuditedOperation(ctx, writer, {
    operationName: "action.process",
    resource: { type: "action", id: event.resourceId },
    action: event.actionType,
    execute: async () => {
      // Business logic — same code that runs in NestJS
      return { processed: true, resourceId: event.resourceId };
    },
  });

  return {
    statusCode: result.success ? 200 : 403,
    body: JSON.stringify(result),
  };
}
