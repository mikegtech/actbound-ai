/**
 * Audit event input contract — framework-agnostic.
 *
 * Defines what callers provide to emit an audit event.
 * No persistence details, no framework imports.
 */

export interface AuditEventInput {
  eventType: string;
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
  occurredAt?: string;
}

/**
 * Audit writer port — the interface callers depend on.
 *
 * Implementations:
 * - NestJS: DurableAuditService wrapping Postgres
 * - Lambda: CloudWatch/DynamoDB writer
 * - Test: in-memory collector
 */
export interface AuditWriter {
  record(
    requestId: string,
    tenantId: string,
    sourceService: string,
    event: AuditEventInput,
  ): Promise<void>;
}
