export type DelegationStatus = "ACTIVE" | "PENDING" | "REVOKED" | "EXPIRED";

export interface Delegation {
  id: string;
  grantor: {
    id: string;
    name: string;
    avatar?: string;
  };
  assistant: {
    id: string;
    internalCode: string;
    name: string;
  };
  organization: {
    id: string;
    name: string;
  };
  scopes: string[];
  status: DelegationStatus;
  createdAt: string;
  expiresAt?: string;
  connectedAccountId?: string;
  resourceIds: string[];
  policyIds: string[];
  auditEventIds: string[];
  securitySignalIds: string[];
}

export type ConnectionState =
  | "HEALTHY"
  | "DISCONNECTED"
  | "NEEDS_ATTENTION"
  | "PENDING";

export interface ConnectedAccount {
  id: string;
  provider: string; // e.g., 'slack', 'github', 'stripe', 'aws'
  connectionState: ConnectionState;
  accountName: string; // e.g., 'engineering-slack', 'stripe-prod'
  identityEmail?: string;
  assistantIds: string[]; // Assistants currently utilizing this connection
  connectedAt: string;
  lastSyncAt?: string;
}

export interface DelegationPostureSummary {
  totalDelegations: number;
  activeDelegations: number;
  pendingDelegations: number;
  revokedDelegations: number;
  healthyConnections: number;
  attentionConnections: number;
}
