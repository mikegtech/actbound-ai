import { PermissionGuard } from "@actbound/authorization";
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";

import { AuthorizationContextMiddleware } from "./common/authorization-context.middleware";
import { AgentActionsController } from "./modules/agent-actions.controller";
import { AuditEventsController } from "./modules/audit-events.controller";
import { DocsController } from "./modules/docs.controller";
import { HealthController } from "./modules/health.controller";
import { MeController } from "./modules/me.controller";

@Module({
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
