import { PermissionGuard, RequirePermission } from "@actbound/authorization";
import {
  AgentActionExecuteRequestSchema,
  AgentActionPreviewRequestSchema,
} from "@actbound/sdk";
import { Body, Controller, Post, UseGuards } from "@nestjs/common";

import { ZodValidationPipe } from "../common/zod-validation.pipe";

@Controller("agent-actions")
@UseGuards(PermissionGuard)
export class AgentActionsController {
  @Post("preview")
  @RequirePermission("agent_actions:preview")
  previewAction(
    @Body(new ZodValidationPipe(AgentActionPreviewRequestSchema))
    body: import("zod").infer<typeof AgentActionPreviewRequestSchema>,
  ) {
    return {
      previewId: `preview_${Date.now()}`,
      action: body.action,
      allowed: true,
      reasons: ["Preview approved by orchestrator placeholder."],
      summary: `Prepared preview for ${body.action} against connection ${body.connectionId}.`,
      scopedTokenRequest: {
        audience: "agent-service",
        scopes: ["valuations.execute"],
        purpose: `Execute ${body.action}`,
        consentGrantId: "cg_demo_001",
      },
    };
  }

  @Post("execute")
  @RequirePermission("agent_actions:execute")
  executeAction(
    @Body(new ZodValidationPipe(AgentActionExecuteRequestSchema))
    body: import("zod").infer<typeof AgentActionExecuteRequestSchema>,
  ) {
    // TODO: Exchange the consent-backed grant for an Auth0 Token Vault scoped token before calling agent-service.
    return {
      executionId: `exec_${Date.now()}`,
      action: body.action,
      status: "accepted" as const,
      reasons: ["Execution accepted by orchestrator placeholder."],
      auditEventId: `audit_${Date.now()}`,
    };
  }
}
