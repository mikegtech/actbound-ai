import { PermissionGuard } from "@actbound/authorization/nest";
import { createFgaClient, RelationshipWriter } from "@actbound/openfga";
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";

import { AuthorizationContextMiddleware } from "./common/authorization-context.middleware";
import { JwtAuthMiddleware } from "./common/jwt-auth.middleware";
import { DurableAuditService } from "./application/audit/durable-audit.service";
import { DecisionTraceEngine } from "./application/authz/decision-trace-engine";
import { PolicyEngine } from "./application/authz/policies/policy-engine";
import { RelationshipManagementService } from "./application/relationships/relationship-management.service";
import { DelegatedActionService } from "./application/delegated-action/delegated-action.service";
import { NestAuditWriter } from "./application/audit/nest-audit-writer";
import { ResourceAccessService } from "./application/resource-access/resource-access.service";
import { DelegatedAccessModule } from "./delegated-access/delegated-access.module";
import { AuditEventStore } from "./domain/audit/audit-event.store";
import { PostgresAuditEventRepository } from "./infrastructure/database/audit-event.repository.impl";
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
import { DelegatedActionController } from "./modules/delegated-action.controller";
import { ResourceAccessController } from "./modules/resource-access.controller";
import { TokenBrokerModule } from "./token-broker/token-broker.module";

@Module({
  imports: [DelegatedAccessModule, TokenBrokerModule],
  controllers: [
    AgentActionsController,
    AssistantRelationshipController,
    AuditEventsController,
    AuthzController,
    DelegatedActionController,
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
    DurableAuditService,
    DelegatedActionService,
    NestAuditWriter,
    { provide: "AUDIT_WRITER", useExisting: NestAuditWriter },
    DecisionTraceEngine,
    PolicyEngine,
    RelationshipManagementService,
    ResourceAccessService,
    // Audit repository — Postgres when DATABASE_URL is set
    {
      provide: "AUDIT_REPOSITORY",
      useClass: PostgresAuditEventRepository,
    },
    // OpenFGA RelationshipWriter
    {
      provide: "RELATIONSHIP_WRITER",
      useFactory: () => {
        const apiUrl = process.env.OPENFGA_API_URL ?? "http://localhost:8180";
        const storeId = process.env.OPENFGA_STORE_ID ?? "";
        const modelId = process.env.OPENFGA_MODEL_ID;

        if (!storeId) {
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
  exports: [AuditEventStore, DurableAuditService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // JWT auth runs first, extracts principal. AuthZ context runs second, uses principal.
    consumer
      .apply(JwtAuthMiddleware, AuthorizationContextMiddleware)
      .forRoutes("*");
  }
}
