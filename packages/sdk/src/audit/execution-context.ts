/**
 * Execution context contract — framework-agnostic.
 *
 * Carries identity, correlation, and scope for any operation.
 * Usable by: NestJS services, background jobs, Lambda handlers, queue consumers.
 * No NestJS, no Express, no AWS SDK imports.
 */

export interface ExecutionPrincipal {
  sub: string;
  principalType: "user" | "service" | "agent";
  displayName?: string;
}

export interface ExecutionContext {
  /** Unique request/invocation ID. */
  requestId: string;
  /** Multi-step workflow correlation. */
  workflowId?: string;
  /** Tenant boundary. */
  tenantId: string;
  /** Authenticated principal. Null for system/cron operations. */
  principal: ExecutionPrincipal | null;
  /** Which service is executing. */
  sourceService: string;
  /** The operation being performed. */
  operationName: string;
}

/**
 * Create an execution context from minimal inputs.
 * Generates a requestId if not provided.
 */
export function createExecutionContext(
  input: Partial<ExecutionContext> & { operationName: string },
): ExecutionContext {
  return {
    requestId:
      input.requestId ??
      crypto.randomUUID?.() ??
      `req_${Date.now().toString(36)}`,
    workflowId: input.workflowId,
    tenantId: input.tenantId ?? "default",
    principal: input.principal ?? null,
    sourceService: input.sourceService ?? "unknown",
    operationName: input.operationName,
  };
}
