import type { ApiRouteContract } from "./types";
import {
  ActivityTimelineSchema,
  AgentActionExecuteRequestSchema,
  AgentActionExecuteResultSchema,
  AgentActionPreviewRequestSchema,
  AgentActionPreviewResultSchema,
  AuditEventListSchema,
  BrokeredTokenResponseSchema,
  ConnectionIdParamsSchema,
  ConnectProviderRequestSchema,
  ConnectProviderResultSchema,
  ConsentPreviewRequestSchema,
  ConsentPreviewResultSchema,
  ConsentSummaryListSchema,
  HealthStatusSchema,
  PermissionDecisionListSchema,
  ProviderConnectionListSchema,
  RevocationIntentSchema,
  RevokeConnectionResultSchema,
  ScopedTokenRequestSchema,
  StandardApiErrorSchema,
  TokenBrokerPreviewResultSchema,
  TokenBrokerStatusSchema,
  TokenCacheSummarySchema,
  UserControlSummarySchema,
  VaultConnectionListSchema,
  VaultSessionListSchema,
} from "../schemas";

export const orchestratorRoutes = {
  health: {
    method: "get",
    path: "/health",
    summary: "Service health status",
    operationId: "getOrchestratorHealth",
    tags: ["Health"],
    responses: {
      200: {
        description: "Orchestrator health status",
        schema: HealthStatusSchema,
      },
    },
  },
  mePermissions: {
    method: "get",
    path: "/me/permissions",
    summary: "Resolved permission decisions for the current actor",
    operationId: "getCurrentActorPermissions",
    tags: ["Me"],
    responses: {
      200: {
        description: "Permission decisions for the current actor",
        schema: PermissionDecisionListSchema,
      },
    },
  },
  meConnections: {
    method: "get",
    path: "/me/connections",
    summary: "Vault and consent-backed connection list",
    operationId: "getCurrentActorConnections",
    tags: ["Me"],
    responses: {
      200: {
        description: "Current actor connections",
        schema: VaultConnectionListSchema,
      },
    },
  },
  connections: {
    method: "get",
    path: "/connections",
    summary: "Delegated provider connections for the current subject",
    operationId: "listProviderConnections",
    tags: ["Delegated Access"],
    responses: {
      200: {
        description: "Provider connections",
        schema: ProviderConnectionListSchema,
      },
      403: {
        description: "Permission denied",
        schema: StandardApiErrorSchema,
      },
    },
  },
  connectProvider: {
    method: "post",
    path: "/connections/connect",
    summary: "Create a delegated provider connection placeholder",
    operationId: "connectProvider",
    tags: ["Delegated Access"],
    request: {
      body: ConnectProviderRequestSchema,
    },
    responses: {
      200: {
        description: "Connected provider placeholder result",
        schema: ConnectProviderResultSchema,
      },
      403: {
        description: "Permission denied",
        schema: StandardApiErrorSchema,
      },
    },
  },
  revokeConnection: {
    method: "post",
    path: "/connections/{id}/revoke",
    summary: "Revoke a delegated provider connection placeholder",
    operationId: "revokeProviderConnection",
    tags: ["Delegated Access"],
    request: {
      params: ConnectionIdParamsSchema,
      body: RevocationIntentSchema,
    },
    responses: {
      200: {
        description: "Revocation placeholder result",
        schema: RevokeConnectionResultSchema,
      },
      403: {
        description: "Permission denied",
        schema: StandardApiErrorSchema,
      },
    },
  },
  consents: {
    method: "get",
    path: "/consents",
    summary: "Delegated consent summaries for the current subject",
    operationId: "listConsentSummaries",
    tags: ["Delegated Access"],
    responses: {
      200: {
        description: "Consent summaries",
        schema: ConsentSummaryListSchema,
      },
      403: {
        description: "Permission denied",
        schema: StandardApiErrorSchema,
      },
    },
  },
  previewConsent: {
    method: "post",
    path: "/consents/preview",
    summary: "Preview delegated consent and step-up requirements",
    operationId: "previewConsent",
    tags: ["Delegated Access"],
    request: {
      body: ConsentPreviewRequestSchema,
    },
    responses: {
      200: {
        description: "Consent preview result",
        schema: ConsentPreviewResultSchema,
      },
      403: {
        description: "Permission denied",
        schema: StandardApiErrorSchema,
      },
    },
  },
  vaultSessions: {
    method: "get",
    path: "/vault/sessions",
    summary: "Delegated vault session metadata for the current subject",
    operationId: "listVaultSessions",
    tags: ["Delegated Access"],
    responses: {
      200: {
        description: "Vault session metadata",
        schema: VaultSessionListSchema,
      },
      403: {
        description: "Permission denied",
        schema: StandardApiErrorSchema,
      },
    },
  },
  previewAgentAction: {
    method: "post",
    path: "/agent-actions/preview",
    summary: "Preview an agent action before execution",
    operationId: "previewAgentAction",
    tags: ["Agent Actions"],
    request: {
      body: AgentActionPreviewRequestSchema,
    },
    responses: {
      200: {
        description: "Agent action preview result",
        schema: AgentActionPreviewResultSchema,
      },
      403: {
        description: "Permission denied",
        schema: StandardApiErrorSchema,
      },
    },
  },
  executeAgentAction: {
    method: "post",
    path: "/agent-actions/execute",
    summary: "Execute an agent action",
    operationId: "executeAgentAction",
    tags: ["Agent Actions"],
    request: {
      body: AgentActionExecuteRequestSchema,
    },
    responses: {
      200: {
        description: "Agent action execution result",
        schema: AgentActionExecuteResultSchema,
      },
      403: {
        description: "Permission denied",
        schema: StandardApiErrorSchema,
      },
    },
  },
  auditEvents: {
    method: "get",
    path: "/audit-events",
    summary: "List audit trail events",
    operationId: "listAuditEvents",
    tags: ["Audit & User Control"],
    responses: {
      200: {
        description: "Audit event list",
        schema: AuditEventListSchema,
      },
    },
  },
  meActivity: {
    method: "get",
    path: "/me/activity",
    summary: "User-scoped activity timeline",
    operationId: "getCurrentActorActivity",
    tags: ["Audit & User Control"],
    responses: {
      200: {
        description: "Activity timeline for the current actor",
        schema: ActivityTimelineSchema,
      },
    },
  },
  meControlSummary: {
    method: "get",
    path: "/me/control-summary",
    summary: "User control dashboard summary",
    operationId: "getCurrentActorControlSummary",
    tags: ["Audit & User Control"],
    responses: {
      200: {
        description: "Aggregated user control metrics",
        schema: UserControlSummarySchema,
      },
    },
  },
  tokenBrokerStatus: {
    method: "get",
    path: "/token-broker/status",
    summary: "Token broker health and cache status",
    operationId: "getTokenBrokerStatus",
    tags: ["Token Broker"],
    responses: {
      200: {
        description: "Token broker status",
        schema: TokenBrokerStatusSchema,
      },
      403: {
        description: "Permission denied",
        schema: StandardApiErrorSchema,
      },
    },
  },
  previewBrokeredToken: {
    method: "post",
    path: "/token-broker/preview",
    summary: "Preview a brokered token request",
    operationId: "previewBrokeredToken",
    tags: ["Token Broker"],
    request: {
      body: ScopedTokenRequestSchema,
    },
    responses: {
      200: {
        description: "Brokered token preview result",
        schema: TokenBrokerPreviewResultSchema,
      },
      403: {
        description: "Permission denied",
        schema: StandardApiErrorSchema,
      },
    },
  },
  retrieveBrokeredToken: {
    method: "post",
    path: "/token-broker/retrieve",
    summary: "Retrieve a brokered token response",
    operationId: "retrieveBrokeredToken",
    tags: ["Token Broker"],
    request: {
      body: ScopedTokenRequestSchema,
    },
    responses: {
      200: {
        description: "Brokered token response",
        schema: BrokeredTokenResponseSchema,
      },
      403: {
        description: "Permission denied",
        schema: StandardApiErrorSchema,
      },
    },
  },
  tokenBrokerCache: {
    method: "get",
    path: "/token-broker/cache",
    summary: "Inspect token broker cache metadata",
    operationId: "getTokenBrokerCacheSummary",
    tags: ["Token Broker"],
    responses: {
      200: {
        description: "Token cache summary",
        schema: TokenCacheSummarySchema,
      },
      403: {
        description: "Permission denied",
        schema: StandardApiErrorSchema,
      },
    },
  },
} satisfies Record<string, ApiRouteContract>;

export const orchestratorRouteList = Object.values(orchestratorRoutes);
