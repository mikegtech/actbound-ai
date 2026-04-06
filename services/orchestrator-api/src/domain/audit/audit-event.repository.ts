/**
 * Audit event repository interface — domain layer.
 *
 * No Drizzle, no pg imports. Pure TypeScript interface.
 * Implementations live in infrastructure/.
 */

export interface AuditEventRecord {
  id: string;
  tenantId: string;
  eventType: string;
  occurredAt: string;
  requestId?: string;
  workflowId?: string;
  actorSub: string;
  actorPrincipalType: string;
  actorDisplayName?: string;
  subjectSub?: string;
  subjectPrincipalType?: string;
  resourceType?: string;
  resourceId?: string;
  action?: string;
  allowed?: boolean;
  reasons?: unknown[];
  metadata: Record<string, unknown>;
  sourceService: string;
  createdAt: string;
}

export interface AuditEventFilter {
  eventType?: string;
  actorSub?: string;
  resourceType?: string;
  resourceId?: string;
  requestId?: string;
  workflowId?: string;
  limit?: number;
  offset?: number;
}

export interface AuditEventRepository {
  insert(
    event: Omit<AuditEventRecord, "id" | "createdAt">,
  ): Promise<AuditEventRecord>;
  findById(id: string): Promise<AuditEventRecord | null>;
  find(filter: AuditEventFilter): Promise<AuditEventRecord[]>;
  findByActor(actorSub: string, limit?: number): Promise<AuditEventRecord[]>;
}
