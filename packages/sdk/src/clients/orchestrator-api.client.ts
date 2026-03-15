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
  TokenBrokerPreviewResultSchema,
  TokenBrokerStatusSchema,
  TokenCacheSummarySchema,
  VaultConnectionListSchema,
} from "../schemas";
import { ApiClientBase } from "./base";

export class OrchestratorApiClient extends ApiClientBase {
  getHealth() {
    return this.get("/health", HealthStatusSchema);
  }

  getMePermissions() {
    return this.get("/me/permissions", PermissionDecisionListSchema);
  }

  getMeConnections() {
    return this.get("/me/connections", VaultConnectionListSchema);
  }

  previewAgentAction(payload: unknown) {
    return this.post(
      "/agent-actions/preview",
      AgentActionPreviewRequestSchema,
      payload,
      AgentActionPreviewResultSchema,
    );
  }

  executeAgentAction(payload: unknown) {
    return this.post(
      "/agent-actions/execute",
      AgentActionExecuteRequestSchema,
      payload,
      AgentActionExecuteResultSchema,
    );
  }

  getAuditEvents() {
    return this.get("/audit-events", AuditEventListSchema);
  }

  getTokenBrokerStatus() {
    return this.get("/token-broker/status", TokenBrokerStatusSchema);
  }

  previewBrokeredToken(payload: unknown) {
    return this.post(
      "/token-broker/preview",
      ScopedTokenRequestSchema,
      payload,
      TokenBrokerPreviewResultSchema,
    );
  }

  retrieveBrokeredToken(payload: unknown) {
    return this.post(
      "/token-broker/retrieve",
      ScopedTokenRequestSchema,
      payload,
      BrokeredTokenResponseSchema,
    );
  }

  getTokenBrokerCache() {
    return this.get("/token-broker/cache", TokenCacheSummarySchema);
  }
}
