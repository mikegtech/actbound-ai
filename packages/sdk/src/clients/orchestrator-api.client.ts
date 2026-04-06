import {
  AbacPolicyListSchema,
  AbacPolicySchema,
  AccessGrantResultSchema,
  DeleteResultSchema,
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
  DecisionTraceResultSchema,
  HealthStatusSchema,
  ExplainResultSchema,
  PermissionDecisionListSchema,
  PolicyViewListSchema,
  RelationshipResultSchema,
  ResourceAccessViewSchema,
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

  // ── Organization Membership ────────────────────────────

  addOrgMember(orgId: string, userId: string) {
    return this.postJson(
      `/organizations/${orgId}/members`,
      { userId },
      RelationshipResultSchema,
    );
  }

  removeOrgMember(orgId: string, userId: string) {
    return this.del(
      `/organizations/${orgId}/members/${userId}`,
      RelationshipResultSchema,
    );
  }

  addOrgAdmin(orgId: string, userId: string) {
    return this.postJson(
      `/organizations/${orgId}/admins`,
      { userId },
      RelationshipResultSchema,
    );
  }

  removeOrgAdmin(orgId: string, userId: string) {
    return this.del(
      `/organizations/${orgId}/admins/${userId}`,
      RelationshipResultSchema,
    );
  }

  assignAssistantToOrg(assistantId: string, orgId: string) {
    return this.postJson(
      `/assistants/${assistantId}/organizations`,
      { orgId },
      RelationshipResultSchema,
    );
  }

  removeAssistantFromOrg(assistantId: string, orgId: string) {
    return this.del(
      `/assistants/${assistantId}/organizations/${orgId}`,
      RelationshipResultSchema,
    );
  }

  // ── Resource Access ────────────────────────────────────

  getResourceAccess(resourceId: string) {
    return this.get(
      `/resources/${resourceId}/access`,
      ResourceAccessViewSchema,
    );
  }

  grantUserResourceAccess(
    resourceId: string,
    userId: string,
    accessLevel: string,
  ) {
    return this.postJson(
      `/resources/${resourceId}/access/users`,
      { id: userId, accessLevel },
      AccessGrantResultSchema,
    );
  }

  grantAssistantResourceAccess(
    resourceId: string,
    assistantId: string,
    accessLevel: string,
  ) {
    return this.postJson(
      `/resources/${resourceId}/access/assistants`,
      { id: assistantId, accessLevel },
      AccessGrantResultSchema,
    );
  }

  grantOrgResourceAccess(
    resourceId: string,
    orgId: string,
    accessLevel: string,
  ) {
    return this.postJson(
      `/resources/${resourceId}/access/organizations`,
      { id: orgId, accessLevel },
      AccessGrantResultSchema,
    );
  }

  revokeUserResourceAccess(resourceId: string, userId: string) {
    return this.del(
      `/resources/${resourceId}/access/users/${userId}`,
      AccessGrantResultSchema,
    );
  }

  revokeAssistantResourceAccess(resourceId: string, assistantId: string) {
    return this.del(
      `/resources/${resourceId}/access/assistants/${assistantId}`,
      AccessGrantResultSchema,
    );
  }

  revokeOrgResourceAccess(resourceId: string, orgId: string) {
    return this.del(
      `/resources/${resourceId}/access/organizations/${orgId}`,
      AccessGrantResultSchema,
    );
  }

  // ── Explainability ─────────────────────────────────────

  explainAccess(
    resourceId: string,
    entityType: string,
    entityId: string,
    action?: string,
  ) {
    const params = action ? `?action=${action}` : "";
    return this.get(
      `/resources/${resourceId}/access/${entityType}/${entityId}/why${params}`,
      ExplainResultSchema,
    );
  }

  // ── ABAC Policy Engine ─────────────────────────────────

  listAbacPolicies() {
    return this.get("/policies/engine", AbacPolicyListSchema);
  }

  getAbacPolicy(id: string) {
    return this.get(`/policies/engine/${id}`, AbacPolicySchema);
  }

  createAbacPolicy(policy: Record<string, unknown>) {
    return this.postJson("/policies/engine", policy, AbacPolicySchema);
  }

  updateAbacPolicy(id: string, updates: Record<string, unknown>) {
    return this.putJson(`/policies/engine/${id}`, updates, AbacPolicySchema);
  }

  deleteAbacPolicy(id: string) {
    return this.del(`/policies/engine/${id}`, DeleteResultSchema);
  }

  // ── Authorization Evaluation ───────────────────────────

  evaluateAuthorization(body: Record<string, unknown>) {
    return this.postJson("/authz/evaluate", body, DecisionTraceResultSchema);
  }
}
