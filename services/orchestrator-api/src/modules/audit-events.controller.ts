import { PermissionGuard, RequirePermission } from "@actbound/authorization";
import { Controller, Get, UseGuards } from "@nestjs/common";

@Controller("audit-events")
@UseGuards(PermissionGuard)
export class AuditEventsController {
  @Get()
  @RequirePermission("audit_events:read")
  getAuditEvents() {
    return {
      events: [
        {
          id: "audit_demo_001",
          actorId: "demo-user",
          action: "agent_actions.execute",
          resourceId: "conn_demo_vault",
          status: "queued" as const,
          occurredAt: new Date().toISOString(),
          metadata: {
            source: "orchestrator-api",
          },
        },
      ],
    };
  }
}
