import type { ActBoundEntityType } from "components/common/EntityRouteLink";

export type AuditActionSignal = "allowed" | "denied" | "warning" | "reviewed";

export interface AuditLinkedEntity {
  type: ActBoundEntityType;
  id: string;
  label: string;
  context: string;
}

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
    routeType?: ActBoundEntityType;
  };
  organizationId?: string;
  linkedEntities?: AuditLinkedEntity[];
  decision: {
    signal: AuditActionSignal;
    reasons?: Array<{ code: string; message: string }>;
  };
  metadata?: Record<string, unknown>;
}
