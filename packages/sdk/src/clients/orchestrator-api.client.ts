import {
  AgentActionExecuteRequestSchema,
  AgentActionExecuteResultSchema,
  AgentActionPreviewRequestSchema,
  AgentActionPreviewResultSchema,
  AuditEventListSchema,
  HealthStatusSchema,
  PermissionDecisionListSchema,
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
}
