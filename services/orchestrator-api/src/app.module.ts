import { PermissionGuard } from "@actbound/authorization/nest";
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";

import { AuthorizationContextMiddleware } from "./common/authorization-context.middleware";
import { DelegatedAccessModule } from "./delegated-access/delegated-access.module";
import { AgentActionsController } from "./modules/agent-actions.controller";
import { AuditEventsController } from "./modules/audit-events.controller";
import { DocsController } from "./modules/docs.controller";
import { HealthController } from "./modules/health.controller";
import { MeController } from "./modules/me.controller";
import { TokenBrokerModule } from "./token-broker/token-broker.module";

@Module({
  imports: [DelegatedAccessModule, TokenBrokerModule],
  controllers: [
    AgentActionsController,
    AuditEventsController,
    DocsController,
    HealthController,
    MeController,
  ],
  providers: [PermissionGuard],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthorizationContextMiddleware).forRoutes("*");
  }
}
