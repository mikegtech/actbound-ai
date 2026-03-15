import { evaluateAuditViewing } from "@actbound/authorization";
import { Controller, ForbiddenException, Get, Req } from "@nestjs/common";

import type { RequestWithAuthContext } from "../common/request-context";

@Controller("audit-events")
export class AuditEventsController {
  @Get()
  getAuditEvents(@Req() request: RequestWithAuthContext) {
    const authContext = request.authContext;

    if (!authContext) {
      throw new ForbiddenException({
        code: "auth_context_missing",
        message: "Authorization context was not attached to the request.",
      });
    }

    const decision = evaluateAuditViewing(authContext, {
      type: "audit_event",
      ownerSubjectId: authContext.subject.id,
    });

    if (!decision.allowed) {
      throw new ForbiddenException({
        code: "permission_denied",
        message: "Audit events are not available for the current context.",
        details: {
          permission: decision.permission,
          reasons: decision.reasons,
        },
      });
    }

    return {
      events: [
        {
          id: "audit_demo_001",
          actorId: authContext.actor.id,
          action: "agent_actions.execute",
          resourceId: authContext.tokenVaultConnection.connectionId,
          status: "queued" as const,
          occurredAt: new Date().toISOString(),
          metadata: {
            source: "orchestrator-api",
            decisionCodes: decision.reasons.map((reason) => reason.code),
          },
        },
      ],
    };
  }
}
