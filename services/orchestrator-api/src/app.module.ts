import { PermissionGuard } from "@actbound/authorization/nest";
import { createFgaClient, RelationshipWriter } from "@actbound/openfga";
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";

import { AuthorizationContextMiddleware } from "./common/authorization-context.middleware";
import { DecisionTraceEngine } from "./application/authz/decision-trace-engine";
import { PolicyEngine } from "./application/authz/policies/policy-engine";
import { RelationshipManagementService } from "./application/relationships/relationship-management.service";
import { ResourceAccessService } from "./application/resource-access/resource-access.service";
import { DelegatedAccessModule } from "./delegated-access/delegated-access.module";
import { AuditEventStore } from "./domain/audit/audit-event.store";
import { AgentActionsController } from "./modules/agent-actions.controller";
import { AuthzController } from "./modules/authz.controller";
import { AuditEventsController } from "./modules/audit-events.controller";
import { DocsController } from "./modules/docs.controller";
import { HealthController } from "./modules/health.controller";
import { MeController } from "./modules/me.controller";
import { PoliciesController } from "./modules/policies.controller";
import { PolicyEngineController } from "./modules/policy-engine.controller";
import {
  AssistantRelationshipController,
  OrganizationMembershipController,
  ResourceAccessController as RelationshipsResourceController,
} from "./modules/relationships.controller";
import { ResourceAccessController } from "./modules/resource-access.controller";
import { TokenBrokerModule } from "./token-broker/token-broker.module";

@Module({
  imports: [DelegatedAccessModule, TokenBrokerModule],
  controllers: [
    AgentActionsController,
    AssistantRelationshipController,
    AuditEventsController,
    AuthzController,
    DocsController,
    HealthController,
    MeController,
    OrganizationMembershipController,
    PoliciesController,
    PolicyEngineController,
    RelationshipsResourceController,
    ResourceAccessController,
  ],
  providers: [
    PermissionGuard,
    AuditEventStore,
    DecisionTraceEngine,
    PolicyEngine,
    RelationshipManagementService,
    ResourceAccessService,
    {
      // Provide the OpenFGA RelationshipWriter from env config.
      // If OPENFGA_STORE_ID is not set, the writer is not available
      // and relationship endpoints will fail clearly.
      provide: "RELATIONSHIP_WRITER",
      useFactory: () => {
        const apiUrl = process.env.OPENFGA_API_URL ?? "http://localhost:8180";
        const storeId = process.env.OPENFGA_STORE_ID ?? "";
        const modelId = process.env.OPENFGA_MODEL_ID;

        if (!storeId) {
          // Return a stub writer with no-op methods.
          // This keeps the app bootable without OpenFGA for local dev.
          const notConfigured = (method: string) => () =>
            Promise.resolve({
              tuple: { user: "", relation: "", object: "" },
              action: "write" as const,
              result: "error" as const,
              error: `OpenFGA not configured (${method}). Set OPENFGA_STORE_ID.`,
            });
          return {
            write: notConfigured("write"),
            delete: notConfigured("delete"),
            check: () => Promise.resolve(false),
            readTuples: () => Promise.resolve([]),
            listRelatedSubjects: () => Promise.resolve([]),
          } as unknown as RelationshipWriter;
        }

        const client = createFgaClient({
          apiUrl,
          storeId,
          authorizationModelId: modelId,
        });
        return new RelationshipWriter(client, modelId);
      },
    },
  ],
  exports: [AuditEventStore],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthorizationContextMiddleware).forRoutes("*");
  }
}
