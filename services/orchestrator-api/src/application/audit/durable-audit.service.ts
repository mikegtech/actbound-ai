/**
 * Durable Audit Service — application layer.
 *
 * Single entry point for recording audit events to persistent storage.
 * All write paths (access grants, policy changes, agent actions, etc.)
 * call this service to record durable events.
 *
 * Falls back to in-memory AuditEventStore when DATABASE_URL is not set.
 */

import { Inject, Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { AuditEventStore } from "../../domain/audit/audit-event.store";
import type {
  AuditEventRecord,
  AuditEventFilter,
  AuditEventRepository,
} from "../../domain/audit/audit-event.repository";

export interface RecordAuditEventInput {
  tenantId?: string;
  eventType: string;
  requestId?: string;
  workflowId?: string;
  actor: {
    sub: string;
    principalType: string;
    displayName?: string;
  };
  subject?: {
    sub: string;
    principalType: string;
  };
  resource?: {
    type: string;
    id: string;
  };
  action?: string;
  decision?: {
    allowed: boolean;
    reasons?: Array<{ code: string; message?: string }>;
  };
  metadata?: Record<string, unknown>;
}

@Injectable()
export class DurableAuditService {
  private readonly logger = new Logger(DurableAuditService.name);

  constructor(
    @Inject("AUDIT_REPOSITORY")
    private readonly repository: AuditEventRepository,
    private readonly inMemoryStore: AuditEventStore,
  ) {}

  async record(input: RecordAuditEventInput): Promise<AuditEventRecord> {
    const now = new Date().toISOString();
    const requestId = input.requestId ?? randomUUID();

    const record = await this.repository.insert({
      tenantId: input.tenantId ?? "default",
      eventType: input.eventType,
      occurredAt: now,
      requestId,
      workflowId: input.workflowId,
      actorSub: input.actor.sub,
      actorPrincipalType: input.actor.principalType,
      actorDisplayName: input.actor.displayName,
      subjectSub: input.subject?.sub,
      subjectPrincipalType: input.subject?.principalType,
      resourceType: input.resource?.type,
      resourceId: input.resource?.id,
      action: input.action,
      allowed: input.decision?.allowed,
      reasons: input.decision?.reasons,
      metadata: input.metadata ?? {},
      sourceService: "orchestrator-api",
    });

    // Also emit to the in-memory store for backward compatibility
    // with the existing activity timeline
    this.inMemoryStore.emit({
      eventType: input.eventType,
      action: input.action ?? input.eventType,
      actor: {
        id: input.actor.sub,
        principalType: input.actor.principalType as
          | "user"
          | "agent"
          | "service"
          | "system",
      },
      onBehalfOf: input.subject?.sub,
      resource: input.resource
        ? { type: input.resource.type, id: input.resource.id }
        : undefined,
      decision: input.decision
        ? {
            allowed: input.decision.allowed,
            reasons: (input.decision.reasons ?? []).map((r) => ({
              code: r.code,
              message: r.message,
            })),
          }
        : undefined,
      status: input.decision
        ? input.decision.allowed
          ? "success"
          : "denied"
        : "success",
      source: "orchestrator",
      requestId,
      workflowId: input.workflowId,
      metadata: input.metadata,
    });

    this.logger.log(
      JSON.stringify({
        event: "audit.recorded",
        id: record.id,
        eventType: input.eventType,
        actor: input.actor.sub,
        resource: input.resource
          ? `${input.resource.type}:${input.resource.id}`
          : undefined,
        allowed: input.decision?.allowed,
      }),
    );

    return record;
  }

  async findById(id: string): Promise<AuditEventRecord | null> {
    return this.repository.findById(id);
  }

  async find(filter: AuditEventFilter): Promise<AuditEventRecord[]> {
    return this.repository.find(filter);
  }

  async findByActor(
    actorSub: string,
    limit?: number,
  ): Promise<AuditEventRecord[]> {
    return this.repository.findByActor(actorSub, limit);
  }
}
