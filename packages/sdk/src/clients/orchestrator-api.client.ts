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
  PolicyViewListSchema,
  ProviderConnectionListSchema,
  RevocationIntentSchema,
  RevokeConnectionResultSchema,
  ScopedTokenRequestSchema,
  TokenBrokerPreviewResultSchema,
  TokenBrokerStatusSchema,
  TokenCacheSummarySchema,
  UserControlSummarySchema,
  VaultConnectionListSchema,
  VaultSessionListSchema,
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

  getConnections() {
    return this.get("/connections", ProviderConnectionListSchema);
  }

  connectProvider(payload: unknown) {
    return this.post(
      "/connections/connect",
      ConnectProviderRequestSchema,
      payload,
      ConnectProviderResultSchema,
    );
  }

  revokeConnection(id: string, payload: unknown) {
    ConnectionIdParamsSchema.parse({
      id,
    });

    return this.post(
      `/connections/${id}/revoke`,
      RevocationIntentSchema,
      payload,
      RevokeConnectionResultSchema,
    );
  }

  getConsents() {
    return this.get("/consents", ConsentSummaryListSchema);
  }

  previewConsent(payload: unknown) {
    return this.post(
      "/consents/preview",
      ConsentPreviewRequestSchema,
      payload,
      ConsentPreviewResultSchema,
    );
  }

  getVaultSessions() {
    return this.get("/vault/sessions", VaultSessionListSchema);
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

  getMeActivity() {
    return this.get("/me/activity", ActivityTimelineSchema);
  }

  getMeControlSummary() {
    return this.get("/me/control-summary", UserControlSummarySchema);
  }

  getPolicies() {
    return this.get("/policies", PolicyViewListSchema);
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
