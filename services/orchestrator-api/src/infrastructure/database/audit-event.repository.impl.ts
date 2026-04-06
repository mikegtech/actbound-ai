/**
 * Durable audit event repository — Postgres/Drizzle implementation.
 *
 * Infrastructure layer only. Domain/application never import this directly.
 */

import { Injectable, Logger } from "@nestjs/common";
import { desc, eq, and, sql } from "drizzle-orm";
import { getDb } from "./connection";
import { auditEvents } from "./schema";
import type {
  AuditEventRecord,
  AuditEventFilter,
  AuditEventRepository,
} from "../../domain/audit/audit-event.repository";

@Injectable()
export class PostgresAuditEventRepository implements AuditEventRepository {
  private readonly logger = new Logger(PostgresAuditEventRepository.name);

  async insert(
    event: Omit<AuditEventRecord, "id" | "createdAt">,
  ): Promise<AuditEventRecord> {
    const db = getDb();
    if (!db) {
      // Fallback: return a synthetic record when DB is not configured
      this.logger.warn("DATABASE_URL not set — audit event not persisted");
      return {
        ...event,
        id: `mem_${Date.now().toString(36)}`,
        createdAt: new Date().toISOString(),
      };
    }

    const [row] = await db
      .insert(auditEvents)
      .values({
        tenantId: event.tenantId,
        eventType: event.eventType,
        occurredAt: new Date(event.occurredAt),
        requestId: event.requestId,
        workflowId: event.workflowId,
        actorSub: event.actorSub,
        actorPrincipalType: event.actorPrincipalType,
        actorDisplayName: event.actorDisplayName,
        subjectSub: event.subjectSub,
        subjectPrincipalType: event.subjectPrincipalType,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        action: event.action,
        allowed: event.allowed,
        reasons: event.reasons as unknown,
        metadata: event.metadata,
        sourceService: event.sourceService,
      })
      .returning();

    return this.toRecord(row!);
  }

  async findById(id: string): Promise<AuditEventRecord | null> {
    const db = getDb();
    if (!db) return null;

    const [row] = await db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.id, id))
      .limit(1);

    return row ? this.toRecord(row) : null;
  }

  async find(filter: AuditEventFilter): Promise<AuditEventRecord[]> {
    const db = getDb();
    if (!db) return [];

    const conditions = [];

    if (filter.eventType) {
      conditions.push(eq(auditEvents.eventType, filter.eventType));
    }
    if (filter.actorSub) {
      conditions.push(eq(auditEvents.actorSub, filter.actorSub));
    }
    if (filter.resourceType) {
      conditions.push(eq(auditEvents.resourceType, filter.resourceType));
    }
    if (filter.resourceId) {
      conditions.push(eq(auditEvents.resourceId, filter.resourceId));
    }
    if (filter.requestId) {
      conditions.push(eq(auditEvents.requestId, filter.requestId));
    }
    if (filter.workflowId) {
      conditions.push(eq(auditEvents.workflowId, filter.workflowId));
    }

    const query = db
      .select()
      .from(auditEvents)
      .orderBy(desc(auditEvents.occurredAt))
      .limit(filter.limit ?? 50)
      .offset(filter.offset ?? 0);

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    const rows = await query;
    return rows.map((r) => this.toRecord(r));
  }

  async findByActor(actorSub: string, limit = 50): Promise<AuditEventRecord[]> {
    const db = getDb();
    if (!db) return [];

    // Find events where this actor is the actor OR the subject
    const rows = await db
      .select()
      .from(auditEvents)
      .where(
        sql`${auditEvents.actorSub} = ${actorSub} OR ${auditEvents.subjectSub} = ${actorSub}`,
      )
      .orderBy(desc(auditEvents.occurredAt))
      .limit(limit);

    return rows.map((r) => this.toRecord(r));
  }

  private toRecord(row: typeof auditEvents.$inferSelect): AuditEventRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      eventType: row.eventType,
      occurredAt: row.occurredAt.toISOString(),
      requestId: row.requestId ?? undefined,
      workflowId: row.workflowId ?? undefined,
      actorSub: row.actorSub,
      actorPrincipalType: row.actorPrincipalType,
      actorDisplayName: row.actorDisplayName ?? undefined,
      subjectSub: row.subjectSub ?? undefined,
      subjectPrincipalType: row.subjectPrincipalType ?? undefined,
      resourceType: row.resourceType ?? undefined,
      resourceId: row.resourceId ?? undefined,
      action: row.action ?? undefined,
      allowed: row.allowed ?? undefined,
      reasons: (row.reasons as unknown[]) ?? undefined,
      metadata: (row.metadata as Record<string, unknown>) ?? {},
      sourceService: row.sourceService,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
