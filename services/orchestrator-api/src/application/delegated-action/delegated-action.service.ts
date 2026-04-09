/**
 * Delegated Action Service — demonstrates the audited operation pattern.
 *
 * Allows previewing and executing a delegated action through the
 * reusable executeAuditedOperation helper. All outcomes (success, denial,
 * failure) are automatically audit-logged.
 */

import { Inject, Injectable, Logger } from "@nestjs/common";
import {
  type AuditWriter,
  type ExecutionContext,
  OperationDeniedError,
  executeAuditedOperation,
  createExecutionContext,
} from "@actbound/sdk";
import type { NormalizedPrincipal } from "../../domain/identity/normalized-principal";

export interface DelegatedActionRequest {
  actionId: string;
  actionType: string;
  targetResourceType: string;
  targetResourceId: string;
  dryRun: boolean;
}

export interface DelegatedActionResult {
  actionId: string;
  status: "previewed" | "executed" | "denied" | "failed";
  summary: string;
}

@Injectable()
export class DelegatedActionService {
  private readonly logger = new Logger(DelegatedActionService.name);

  constructor(
    @Inject("AUDIT_WRITER") private readonly auditWriter: AuditWriter,
  ) {}

  /**
   * Build execution context from a request principal.
   * This is the bridge between NestJS request and the framework-agnostic pattern.
   */
  buildContext(
    principal: NormalizedPrincipal | undefined,
    requestId?: string,
  ): ExecutionContext {
    return createExecutionContext({
      requestId,
      tenantId: principal?.tenantId ?? "default",
      principal: principal
        ? {
            sub: principal.internalSubjectId,
            principalType: principal.principalType,
            displayName: principal.clientId,
          }
        : null,
      sourceService: "orchestrator-api",
      operationName: "delegated-action",
    });
  }

  /**
   * Preview or execute a delegated action with full audit trail.
   */
  async run(
    ctx: ExecutionContext,
    request: DelegatedActionRequest,
  ): Promise<DelegatedActionResult> {
    const operationName = request.dryRun
      ? "delegated.action.preview"
      : "delegated.action.execute";

    const result = await executeAuditedOperation(ctx, this.auditWriter, {
      operationName,
      resource: {
        type: request.targetResourceType,
        id: request.targetResourceId,
      },
      action: request.actionType,
      metadata: {
        actionId: request.actionId,
        dryRun: request.dryRun,
      },
      execute: async () => {
        // Business logic: check if the action is allowed
        this.validateAction(ctx, request);

        // Simulate the action
        return {
          actionId: request.actionId,
          status: request.dryRun
            ? ("previewed" as const)
            : ("executed" as const),
          summary: request.dryRun
            ? `Preview: ${request.actionType} on ${request.targetResourceType}:${request.targetResourceId} would succeed`
            : `Executed: ${request.actionType} on ${request.targetResourceType}:${request.targetResourceId}`,
        };
      },
    });

    if (!result.success) {
      return {
        actionId: request.actionId,
        status: result.outcome === "denied" ? "denied" : "failed",
        summary: result.error ?? "Operation failed",
      };
    }

    return result.data!;
  }

  private validateAction(
    ctx: ExecutionContext,
    request: DelegatedActionRequest,
  ): void {
    // Demo validation: agents need explicit delegation
    if (ctx.principal?.principalType === "agent" && !request.dryRun) {
      // In a real system, check OpenFGA for executor + delegator tuples
      throw new OperationDeniedError(
        "Agent execution requires explicit user delegation",
        [{ code: "delegation_required", message: "No delegation grant found" }],
      );
    }

    // Demo validation: restrict certain action types
    if (request.actionType === "delete" && !request.dryRun) {
      throw new OperationDeniedError(
        "Destructive actions require step-up authentication",
        [{ code: "step_up_required", message: "MFA verification needed" }],
      );
    }
  }
}
