/**
 * Audited operation pattern — framework-agnostic.
 *
 * Wraps a business function with automatic audit event emission:
 * - *.requested on start
 * - *.completed on success
 * - *.denied when business logic signals authorization denial
 * - *.failed on unexpected error
 *
 * Usage:
 *   const result = await executeAuditedOperation(ctx, writer, {
 *     operationName: "resource.access.grant",
 *     resource: { type: "resource", id: "proj-1" },
 *     action: "grant",
 *     execute: async () => { ... return result; }
 *   });
 */

import type { ExecutionContext } from "./execution-context";
import type { AuditWriter } from "./audit-input";

/**
 * Thrown by business logic to signal an authorization/policy denial.
 * Distinct from unexpected errors — results in a "denied" audit event.
 */
export class OperationDeniedError extends Error {
  constructor(
    message: string,
    public readonly reasons: Array<{ code: string; message?: string }> = [],
  ) {
    super(message);
    this.name = "OperationDeniedError";
  }
}

export interface AuditedOperationConfig<T> {
  /** Base event type name (e.g., "resource.access.grant"). Suffixed with .requested/.completed/.denied/.failed. */
  operationName: string;
  /** Resource being acted on. */
  resource?: { type: string; id: string };
  /** Action name. */
  action?: string;
  /** Subject being affected (if different from principal). */
  subject?: { sub: string; principalType: string };
  /** Additional metadata to include in all emitted events. */
  metadata?: Record<string, unknown>;
  /** The business function to execute. */
  execute: () => Promise<T>;
}

export interface AuditedOperationResult<T> {
  success: boolean;
  outcome: "completed" | "denied" | "failed";
  data?: T;
  error?: string;
  reasons?: Array<{ code: string; message?: string }>;
}

/**
 * Execute a business operation with automatic audit event emission.
 */
export async function executeAuditedOperation<T>(
  ctx: ExecutionContext,
  writer: AuditWriter,
  config: AuditedOperationConfig<T>,
): Promise<AuditedOperationResult<T>> {
  const actor = ctx.principal
    ? {
        sub: ctx.principal.sub,
        principalType: ctx.principal.principalType,
        displayName: ctx.principal.displayName,
      }
    : { sub: "system", principalType: "service" };

  const baseEvent = {
    actor,
    subject: config.subject,
    resource: config.resource,
    action: config.action ?? config.operationName,
    metadata: {
      ...config.metadata,
      operationName: config.operationName,
    },
  };

  // Emit requested event
  await writer.record(ctx.requestId, ctx.tenantId, ctx.sourceService, {
    eventType: `${config.operationName}.requested`,
    ...baseEvent,
  });

  try {
    const data = await config.execute();

    // Emit completed event
    await writer.record(ctx.requestId, ctx.tenantId, ctx.sourceService, {
      eventType: `${config.operationName}.completed`,
      ...baseEvent,
      decision: { allowed: true },
    });

    return { success: true, outcome: "completed", data };
  } catch (err) {
    if (err instanceof OperationDeniedError) {
      // Authorization/policy denial — emit denied event
      await writer.record(ctx.requestId, ctx.tenantId, ctx.sourceService, {
        eventType: `${config.operationName}.denied`,
        ...baseEvent,
        decision: { allowed: false, reasons: err.reasons },
        metadata: { ...baseEvent.metadata, denialMessage: err.message },
      });

      return {
        success: false,
        outcome: "denied",
        error: err.message,
        reasons: err.reasons,
      };
    }

    // Unexpected error — emit failed event (never log stack traces or secrets)
    const errorMessage = err instanceof Error ? err.message : "Unknown error";

    await writer.record(ctx.requestId, ctx.tenantId, ctx.sourceService, {
      eventType: `${config.operationName}.failed`,
      ...baseEvent,
      decision: {
        allowed: false,
        reasons: [{ code: "error", message: errorMessage }],
      },
      metadata: {
        ...baseEvent.metadata,
        errorType: err instanceof Error ? err.name : "unknown",
      },
    });

    return { success: false, outcome: "failed", error: errorMessage };
  }
}
