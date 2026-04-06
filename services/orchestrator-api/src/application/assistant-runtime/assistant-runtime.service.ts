/**
 * Assistant Runtime Service — Phase 8 Complete
 *
 * Central enforcement engine for assistant actions.
 * 1. Assistant exists and is active (app DB)
 * 2. Tenant/org scope is correct
 * 3. Delegation validated via OpenFGA Check when delegated
 * 4. Tool authorization checked via central registry
 * 5. Secret boundary enforced
 * 6. All outcomes emit durable audit events with correlation
 */

import { Inject, Injectable, Logger, Optional } from "@nestjs/common";
import {
  type AuditWriter,
  type ExecutionContext,
  OperationDeniedError,
  executeAuditedOperation,
  createExecutionContext,
} from "@actbound/sdk";
import type { RelationshipWriter } from "@actbound/openfga";
import type { Principal } from "../../domain/identity/principal";
import type { AssistantRepository } from "../../domain/assistants/assistant.repository";
import type { ObservabilityService } from "../observability/observability.service";

// ── Types ─────────────────────────────────────────────────

export type ExecutionMode = "independent" | "delegated";

export interface AssistantActionRequest {
  assistantId: string;
  actionName: string;
  targetResourceType?: string;
  targetResourceId?: string;
  toolName?: string;
  executionMode: ExecutionMode;
  onBehalfOf?: string;
  secretCategory?: string;
  workflowId?: string;
  metadata?: Record<string, unknown>;
}

export interface AssistantActionResult {
  assistantId: string;
  actionName: string;
  status: "completed" | "denied" | "failed";
  executionMode: ExecutionMode;
  summary: string;
  reasons?: Array<{ code: string; message?: string }>;
}

// ── Tool Registry ─────────────────────────────────────────

export interface ToolRegistryEntry {
  toolId: string;
  category: string;
  requiresDelegation: boolean;
  enabled: boolean;
}

const DEFAULT_TOOLS: ToolRegistryEntry[] = [
  {
    toolId: "read-internal",
    category: "read",
    requiresDelegation: false,
    enabled: true,
  },
  {
    toolId: "write-internal",
    category: "write",
    requiresDelegation: false,
    enabled: true,
  },
  {
    toolId: "read-external",
    category: "read",
    requiresDelegation: true,
    enabled: true,
  },
  {
    toolId: "write-external",
    category: "write",
    requiresDelegation: true,
    enabled: true,
  },
  {
    toolId: "destructive",
    category: "destructive",
    requiresDelegation: true,
    enabled: true,
  },
  {
    toolId: "deprecated-tool",
    category: "legacy",
    requiresDelegation: false,
    enabled: false,
  },
];

// Per-assistant tool allowlists. "*" = all enabled tools allowed.
const TOOL_ALLOWLISTS: Record<string, string[] | "*"> = {};

const ALLOWED_SECRET_CATEGORIES = new Set(["platform-api-key"]);
const FORBIDDEN_SECRET_CATEGORIES = new Set([
  "database-credentials",
  "infrastructure",
  "encryption-keys",
  "other-assistant-credentials",
]);

@Injectable()
export class AssistantRuntimeService {
  private readonly logger = new Logger(AssistantRuntimeService.name);
  private readonly tools: ToolRegistryEntry[] = [...DEFAULT_TOOLS];

  constructor(
    @Inject("AUDIT_WRITER") private readonly auditWriter: AuditWriter,
    @Inject("ASSISTANT_REPOSITORY")
    private readonly assistantRepo: AssistantRepository,
    @Inject("RELATIONSHIP_WRITER") private readonly fga: RelationshipWriter,
    @Optional()
    @Inject("OBSERVABILITY")
    private readonly obs?: ObservabilityService,
  ) {}

  buildContext(
    principal: Principal | undefined,
    requestId?: string,
    workflowId?: string,
  ): ExecutionContext {
    return createExecutionContext({
      requestId,
      workflowId,
      tenantId: principal?.tenantId ?? "default",
      principal: principal
        ? {
            sub: principal.sub,
            principalType: principal.principalType,
            displayName: principal.clientId,
          }
        : null,
      sourceService: "orchestrator-api",
      operationName: "assistant.runtime",
    });
  }

  async execute(
    ctx: ExecutionContext,
    request: AssistantActionRequest,
  ): Promise<AssistantActionResult> {
    const execCtx = request.workflowId
      ? { ...ctx, workflowId: request.workflowId }
      : ctx;

    const result = await executeAuditedOperation(execCtx, this.auditWriter, {
      operationName: "assistant.action",
      resource: request.targetResourceId
        ? {
            type: request.targetResourceType ?? "resource",
            id: request.targetResourceId,
          }
        : undefined,
      action: request.actionName,
      metadata: {
        assistantId: request.assistantId,
        executionMode: request.executionMode,
        toolName: request.toolName,
        onBehalfOf: request.onBehalfOf,
        workflowId: request.workflowId ?? execCtx.workflowId,
      },
      execute: async () => {
        await this.checkAssistantActive(request.assistantId, execCtx.tenantId);
        if (request.executionMode === "delegated")
          await this.checkDelegation(request);
        if (request.toolName) this.checkToolAuthorization(request);
        if (request.secretCategory)
          this.checkSecretBoundary(request.secretCategory);

        return {
          assistantId: request.assistantId,
          actionName: request.actionName,
          status: "completed" as const,
          executionMode: request.executionMode,
          summary: `Action "${request.actionName}" executed by assistant ${request.assistantId}`,
        };
      },
    });

    // Emit observability timing
    this.obs?.timing("runtime.execution", Date.now() - Date.now(), {
      assistantId: request.assistantId,
      actionName: request.actionName,
    });

    if (!result.success) {
      // Emit observability denied/failed signal
      const reasonCode = result.reasons?.[0]?.code ?? "unknown";
      if (result.outcome === "denied") {
        this.obs?.emitDenied({
          category: "runtime",
          reasonCode,
          assistantId: request.assistantId,
          tenantId: execCtx.tenantId,
          resourceId: request.targetResourceId,
          requestId: execCtx.requestId,
        });

        if (reasonCode === "assistant_disabled") {
          this.obs?.emitDisabledInvocation({
            assistantId: request.assistantId,
            requestId: execCtx.requestId,
            tenantId: execCtx.tenantId,
          });
        }

        if (
          reasonCode === "secret_access_denied" ||
          reasonCode === "secret_category_unknown"
        ) {
          this.obs?.emitSecretBoundaryDenied({
            secretCategory: request.secretCategory ?? "unknown",
            assistantId: request.assistantId,
            requestId: execCtx.requestId,
          });
        }
      }

      if (result.outcome === "failed" && result.error?.includes("OpenFGA")) {
        this.obs?.emitDependencyFailure({
          dependency: "openfga",
          error: result.error,
          requestId: execCtx.requestId,
        });
      }

      return {
        assistantId: request.assistantId,
        actionName: request.actionName,
        status: result.outcome === "denied" ? "denied" : "failed",
        executionMode: request.executionMode,
        summary: result.error ?? "Action failed",
        reasons: result.reasons,
      };
    }

    return result.data!;
  }

  // ── Kill-Switch ─────────────────────────────────────────

  async disableAssistant(
    assistantId: string,
    disabledBy: string,
    ctx: ExecutionContext,
  ): Promise<{ success: boolean; previousStatus: string }> {
    const assistant = await this.assistantRepo.findById(assistantId);
    if (!assistant) return { success: false, previousStatus: "not_found" };

    const previousStatus = assistant.status;
    await this.assistantRepo.updateStatus(assistantId, "disabled", disabledBy);

    await this.auditWriter.record(
      ctx.requestId,
      ctx.tenantId,
      ctx.sourceService,
      {
        eventType: "assistant.killed",
        actor: { sub: disabledBy, principalType: "user" },
        resource: { type: "assistant", id: assistantId },
        action: "kill-switch",
        decision: { allowed: true },
        metadata: { previousStatus },
      },
    );

    this.logger.warn(
      `Kill-switch: assistant ${assistantId} disabled by ${disabledBy}`,
    );
    return { success: true, previousStatus };
  }

  // ── Tool Registry ───────────────────────────────────────

  getToolRegistry(): ToolRegistryEntry[] {
    return [...this.tools];
  }

  registerTool(entry: ToolRegistryEntry): void {
    const idx = this.tools.findIndex((t) => t.toolId === entry.toolId);
    if (idx >= 0) this.tools[idx] = entry;
    else this.tools.push(entry);
  }

  setAssistantToolAllowlist(
    assistantId: string,
    toolIds: string[] | "*",
  ): void {
    TOOL_ALLOWLISTS[assistantId] = toolIds;
  }

  // ── Private Checks ──────────────────────────────────────

  private async checkAssistantActive(
    assistantId: string,
    tenantId: string,
  ): Promise<void> {
    const a = await this.assistantRepo.findById(assistantId);
    if (!a)
      throw new OperationDeniedError(`Assistant "${assistantId}" not found`, [
        { code: "assistant_not_found" },
      ]);
    if (a.status !== "active")
      throw new OperationDeniedError(
        `Assistant "${assistantId}" is ${a.status}`,
        [{ code: "assistant_disabled", message: `Status: ${a.status}` }],
      );
    if (a.tenantId !== tenantId)
      throw new OperationDeniedError(`Tenant mismatch for "${assistantId}"`, [
        { code: "tenant_mismatch" },
      ]);
  }

  private async checkDelegation(
    request: AssistantActionRequest,
  ): Promise<void> {
    if (!request.onBehalfOf) {
      throw new OperationDeniedError(
        "Delegated execution requires onBehalfOf",
        [{ code: "delegation_missing" }],
      );
    }

    if (request.targetResourceId) {
      const allowed = await this.fga.check({
        user: `user:${request.onBehalfOf}`,
        relation: "viewer",
        object: `${request.targetResourceType ?? "resource"}:${request.targetResourceId}`,
      });

      if (!allowed) {
        throw new OperationDeniedError(
          `User "${request.onBehalfOf}" lacks access to ${request.targetResourceType}:${request.targetResourceId}`,
          [
            {
              code: "delegation_user_lacks_access",
              message: `OpenFGA denied viewer on target resource`,
            },
          ],
        );
      }
    }
  }

  private checkToolAuthorization(request: AssistantActionRequest): void {
    const tool = this.tools.find((t) => t.toolId === request.toolName);
    if (!tool)
      throw new OperationDeniedError(
        `Tool "${request.toolName}" not registered`,
        [{ code: "tool_not_registered" }],
      );
    if (!tool.enabled)
      throw new OperationDeniedError(`Tool "${request.toolName}" is disabled`, [
        { code: "tool_disabled" },
      ]);

    const allowlist = TOOL_ALLOWLISTS[request.assistantId];
    if (
      allowlist &&
      allowlist !== "*" &&
      !allowlist.includes(request.toolName!)
    ) {
      throw new OperationDeniedError(
        `Assistant not authorized for tool "${request.toolName}"`,
        [{ code: "tool_not_allowed_for_assistant" }],
      );
    }

    if (tool.requiresDelegation && request.executionMode !== "delegated") {
      throw new OperationDeniedError(
        `Tool "${request.toolName}" requires delegation`,
        [{ code: "delegation_required_for_tool" }],
      );
    }
  }

  private checkSecretBoundary(cat: string): void {
    if (FORBIDDEN_SECRET_CATEGORIES.has(cat))
      throw new OperationDeniedError(`Secret "${cat}" forbidden`, [
        { code: "secret_access_denied" },
      ]);
    if (!ALLOWED_SECRET_CATEGORIES.has(cat))
      throw new OperationDeniedError(`Secret "${cat}" unknown`, [
        { code: "secret_category_unknown" },
      ]);
  }
}
