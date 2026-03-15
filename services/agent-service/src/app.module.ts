import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";

import { AuthorizationContextMiddleware } from "./common/authorization-context.middleware";
import { DocsController } from "./modules/docs.controller";
import { HealthController } from "./modules/health.controller";
import { ListingsController } from "./modules/listings.controller";
import { ValuationsController } from "./modules/valuations.controller";

@Module({
  controllers: [
    DocsController,
    HealthController,
    ListingsController,
    ValuationsController,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthorizationContextMiddleware).forRoutes("*");
  }
}
