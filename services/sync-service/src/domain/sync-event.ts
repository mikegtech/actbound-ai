/**
 * Normalized sync event model.
 *
 * Framework-agnostic internal event contract.
 * Auth0 webhooks, manual triggers, and reconciliation jobs
 * all produce events in this format.
 */

export type SyncEventType =
  | "org.membership.changed"
  | "user.projected"
  | "invitation.accepted"
  | "access.revoked"
  | "assistant.delegation.changed"
  | "reconciliation.requested";

export type SyncEventStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "dead_letter";

export interface SyncEvent {
  id: string;
  eventType: SyncEventType;
  status: SyncEventStatus;
  payload: Record<string, unknown>;
  tenantId: string;
  correlationId: string;
  retryCount: number;
  maxRetries: number;
  error?: string;
  createdAt: string;
  processedAt?: string;
}

export const MAX_RETRIES = 3;

export function isRetryable(event: SyncEvent): boolean {
  return event.status === "failed" && event.retryCount < event.maxRetries;
}

export function shouldDeadLetter(event: SyncEvent): boolean {
  return event.status === "failed" && event.retryCount >= event.maxRetries;
}
