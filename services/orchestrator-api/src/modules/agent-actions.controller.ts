import {
  evaluateAgentActionExecute,
  evaluateAgentActionPreview,
  type PermissionResourceContext,
} from "@actbound/authorization";
import {
  AgentActionExecuteRequestSchema,
  AgentActionPreviewRequestSchema,
} from "@actbound/sdk";
import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  Req,
} from "@nestjs/common";
import {
  toPermissionContextSummary,
  toPermissionDecisionRecord,
} from "@actbound/sdk";

import type { RequestWithAuthContext } from "../common/request-context";
import { ZodValidationPipe } from "../common/zod-validation.pipe";

@Controller("agent-actions")
export class AgentActionsController {
  @Post("preview")
  previewAction(
    @Body(new ZodValidationPipe(AgentActionPreviewRequestSchema))
    body: import("zod").infer<typeof AgentActionPreviewRequestSchema>,
    @Req() request: RequestWithAuthContext,
  ) {
    const authContext = request.authContext;

    if (!authContext) {
      throw new ForbiddenException({
        code: "auth_context_missing",
        message: "Authorization context was not attached to the request.",
      });
    }

    const previewContext = {
      ...authContext,
      consent: {
        ...authContext.consent,
        grantId: body.consentGrantId ?? authContext.consent.grantId,
      },
      tokenVaultConnection: {
        ...authContext.tokenVaultConnection,
        connectionId: body.connectionId,
      },
      attributes: {
        ...authContext.attributes,
        previewMode: true,
      },
    };
    const resource: PermissionResourceContext = {
      type: "agent_action",
      id: body.action,
      ownerSubjectId: previewContext.subject.id,
    };
    const decision = evaluateAgentActionPreview(previewContext, resource);

    return {
      previewId: `preview_${Date.now()}`,
      action: body.action,
      summary: decision.allowed
        ? `Preview approved for ${body.action} using connection ${body.connectionId}.`
        : `Preview denied for ${body.action} until the permission reasons are resolved.`,
      context: toPermissionContextSummary(previewContext),
      permissionDecision: toPermissionDecisionRecord(decision, "orchestrator"),
      scopedTokenRequest: decision.allowed
        ? {
            audience:
              previewContext.attributes.tokenAudience ?? "agent-service",
            scopes: ["valuations.execute"],
            purpose: `Execute ${body.action}`,
            consentGrantId:
              body.consentGrantId ?? previewContext.consent.grantId,
          }
        : undefined,
    };
  }

  @Post("execute")
  executeAction(
    @Body(new ZodValidationPipe(AgentActionExecuteRequestSchema))
    body: import("zod").infer<typeof AgentActionExecuteRequestSchema>,
    @Req() request: RequestWithAuthContext,
  ) {
    const authContext = request.authContext;

    if (!authContext) {
      throw new ForbiddenException({
        code: "auth_context_missing",
        message: "Authorization context was not attached to the request.",
      });
    }

    const executionContext = {
      ...authContext,
      consent: {
        ...authContext.consent,
        grantId: body.consentGrantId ?? authContext.consent.grantId,
      },
      tokenVaultConnection: {
        ...authContext.tokenVaultConnection,
        connectionId: body.connectionId,
      },
    };
    const resource: PermissionResourceContext = {
      type: "agent_action",
      id: body.action,
      ownerSubjectId: executionContext.subject.id,
    };
    const decision = evaluateAgentActionExecute(executionContext, resource);

    // TODO: Exchange the consent-backed grant for a real Auth0 Token Vault scoped token before calling agent-service.
    return {
      executionId: `exec_${Date.now()}`,
      action: body.action,
      status: decision.allowed ? ("accepted" as const) : ("denied" as const),
      reasons: decision.reasons.map((reason) => reason.message),
      auditEventId: `audit_${Date.now()}`,
      permissionDecision: toPermissionDecisionRecord(decision, "orchestrator"),
    };
  }
}
