import type { ApiRouteContract } from "./types";
import {
  AgentActionExecuteRequestSchema,
  AgentActionExecuteResultSchema,
  AgentActionPreviewRequestSchema,
  AgentActionPreviewResultSchema,
  AuditEventListSchema,
  BrokeredTokenResponseSchema,
  HealthStatusSchema,
  PermissionDecisionListSchema,
  ScopedTokenRequestSchema,
  StandardApiErrorSchema,
  TokenBrokerPreviewResultSchema,
  TokenBrokerStatusSchema,
  TokenCacheSummarySchema,
  VaultConnectionListSchema,
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
    tags: ["Audit Events"],
    responses: {
      200: {
        description: "Audit event list",
        schema: AuditEventListSchema,
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
