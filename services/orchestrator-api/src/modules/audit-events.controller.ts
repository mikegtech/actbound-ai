import { evaluateAuditViewing } from "@actbound/authorization";
import { Controller, ForbiddenException, Get, Req } from "@nestjs/common";

import type { RequestWithAuthContext } from "../common/request-context";
import { AuditEventStore } from "../domain/audit/audit-event.store";

@Controller("audit-events")
export class AuditEventsController {
  constructor(private readonly auditStore: AuditEventStore) {}

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

    // Seed demo events on first access
    this.auditStore.seedDemoEvents(authContext.actor.id);

    // Emit an audit event for this access
    this.auditStore.emit({
      eventType: "audit.access.success",
      action: "read",
      actor: {
        id: authContext.actor.id,
        principalType: authContext.actor.type,
      },
      resource: { type: "audit_event" },
      decision: {
        allowed: true,
        reasons: [{ code: "policy_allow" }],
      },
      status: "success",
      source: "orchestrator",
    });

    return {
      events: this.auditStore.listAll(),
    };
  }
}
