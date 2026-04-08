import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type {
  AuditEvent,
  AuditActorSummary,
  AuditResourceSummary,
  AuditDecisionSummary,
  ActivityTimelineEntry,
} from "@actbound/sdk";

export type EmitAuditEventInput = {
  eventType: string;
  action: string;
  actor: AuditActorSummary;
  onBehalfOf?: string;
  resource?: AuditResourceSummary;
  decision?: AuditDecisionSummary;
  status: AuditEvent["status"];
  stepUpRequired?: boolean;
  source?: AuditEvent["source"];
  requestId?: string;
  workflowId?: string;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class AuditEventStore {
  private readonly events: AuditEvent[] = [];
  private readonly maxEvents = 200;

  emit(input: EmitAuditEventInput): AuditEvent {
    const event: AuditEvent = {
      id: `audit_${randomUUID().slice(0, 8)}`,
      eventType: input.eventType,
      action: input.action,
      actor: input.actor,
      onBehalfOf: input.onBehalfOf,
      resource: input.resource,
      decision: input.decision,
      status: input.status,
      stepUpRequired: input.stepUpRequired,
      source: input.source ?? "orchestrator",
      occurredAt: new Date().toISOString(),
      requestId: input.requestId ?? randomUUID(),
      workflowId: input.workflowId,
      metadata: input.metadata ?? {},
    };

    this.events.unshift(event);
    if (this.events.length > this.maxEvents) {
      this.events.pop();
    }

    return event;
  }

  listAll(limit = 50): AuditEvent[] {
    return this.events.slice(0, limit);
  }

  listByActor(actorId: string, limit = 50): AuditEvent[] {
    return this.events
      .filter((e) => e.actor.id === actorId || e.onBehalfOf === actorId)
      .slice(0, limit);
  }

  toTimeline(events: AuditEvent[]): ActivityTimelineEntry[] {
    return events.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      summary: this.buildSummary(e),
      actor: e.actor,
      onBehalfOf: e.onBehalfOf,
      resource: e.resource,
      allowed: e.decision?.allowed,
      stepUpRequired: e.stepUpRequired,
      occurredAt: e.occurredAt,
    }));
  }

  getStats(actorId: string) {
    const actorEvents = this.events.filter(
      (e) => e.actor.id === actorId || e.onBehalfOf === actorId,
    );
    return {
      recentActivity: actorEvents.length,
      revocations: actorEvents.filter(
        (e) => e.eventType === "delegated_access.revoke.success",
      ).length,
    };
  }

  private buildSummary(event: AuditEvent): string {
    const verb = event.action.replace(/_/g, " ");
    const resource = event.resource?.label ?? event.resource?.type ?? "";
    const outcome =
      event.decision?.allowed === false ? " (denied)" : " (allowed)";

    if (event.onBehalfOf) {
      return `Agent ${verb} ${resource}${outcome} on behalf of user`;
    }
    return `${verb} ${resource}${outcome}`.trim();
  }

  // Seed demo events for development
  seedDemoEvents(actorId: string): void {
    if (this.events.length > 0) return;

    const actor: AuditActorSummary = {
      id: actorId,
      principalType: "user",
    };
    const agentActor: AuditActorSummary = {
      id: "agent_research_001",
      principalType: "agent",
      agentType: "research",
      agentInstanceId: "agent_research_001",
    };
    const now = Date.now();

    const demoEvents: EmitAuditEventInput[] = [
      {
        eventType: "delegated_access.connect.success",
        action: "connect",
        actor,
        resource: {
          type: "provider_connection",
          id: "conn_google_001",
          label: "Google (demo@actbound.dev)",
        },
        status: "success",
        source: "orchestrator",
      },
      {
        eventType: "authorization.evaluate.success",
        action: "permissions:read",
        actor,
        resource: { type: "permissions" },
        decision: { allowed: true, reasons: [{ code: "policy_allow" }] },
        status: "success",
        source: "orchestrator",
      },
      {
        eventType: "token_broker.preview.success",
        action: "broker",
        actor,
        resource: {
          type: "brokered_token",
          label: "M2M token preview",
        },
        decision: { allowed: true, reasons: [{ code: "policy_allow" }] },
        status: "success",
        source: "orchestrator",
      },
      {
        eventType: "agent_action.preview.success",
        action: "preview",
        actor: agentActor,
        onBehalfOf: actorId,
        resource: {
          type: "agent_action",
          id: "action_001",
          label: "Research task",
        },
        decision: { allowed: true, reasons: [{ code: "policy_allow" }] },
        status: "success",
        source: "orchestrator",
        stepUpRequired: false,
      },
      {
        eventType: "agent_action.execute.success",
        action: "execute",
        actor: agentActor,
        onBehalfOf: actorId,
        resource: {
          type: "agent_action",
          id: "action_001",
          label: "Research task",
        },
        decision: { allowed: true, reasons: [{ code: "policy_allow" }] },
        status: "success",
        source: "orchestrator",
      },
      {
        eventType: "sensitive_action.execute.denied",
        action: "execute",
        actor: agentActor,
        onBehalfOf: actorId,
        resource: {
          type: "sensitive_action",
          id: "action_002",
          label: "Financial trade",
        },
        decision: {
          allowed: false,
          reasons: [
            {
              code: "step_up_required",
              message: "Step-up authentication required",
            },
          ],
        },
        status: "denied",
        source: "orchestrator",
        stepUpRequired: true,
      },
      {
        eventType: "token_broker.retrieve.success",
        action: "retrieve",
        actor,
        resource: {
          type: "brokered_token",
          label: "M2M token issued",
        },
        decision: { allowed: true, reasons: [{ code: "policy_allow" }] },
        status: "success",
        source: "orchestrator",
      },
    ];

    // Emit in reverse order so newest appears first
    for (let i = demoEvents.length - 1; i >= 0; i--) {
      const input = demoEvents[i]!;
      const event = this.emit(input);
      // Backdate events for realistic timeline
      (event as { occurredAt: string }).occurredAt = new Date(
        now - i * 120_000,
      ).toISOString();
    }
  }
}
