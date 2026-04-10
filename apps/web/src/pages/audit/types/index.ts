export type AuditActionSignal = "allowed" | "denied" | "warning" | "reviewed";

export interface AuditEventDto {
  id: string;
  eventType: string;
  action: string;
  occurredAt: string;
  actor: {
    sub: string;
    principalType: "user" | "service" | "assistant";
    displayName?: string;
  };
  assistantContext?: {
    assistantId: string;
    displayName: string;
    delegatedBySub?: string;
  };
  resource?: {
    type: string;
    id: string;
    displayName: string;
  };
  organizationId?: string;
  decision: {
    signal: AuditActionSignal;
    reasons?: Array<{ code: string; message: string }>;
  };
  metadata?: Record<string, unknown>;
}
