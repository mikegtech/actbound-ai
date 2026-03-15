import { Module } from "@nestjs/common";

import { TokenBrokerService } from "../application/token-broker/token-broker.service";
import { TokenBrokerCacheStore } from "../domain/token-broker/token-broker-cache.store";
import { DelegatedAccessModule } from "../delegated-access/delegated-access.module";
import { RedisTokenBrokerCacheStore } from "../infrastructure/token-broker/redis-token-broker-cache.store";
import { TokenBrokerController } from "../presentation/http/controllers/token-broker.controller";

@Module({
  imports: [DelegatedAccessModule],
  controllers: [TokenBrokerController],
  providers: [
    TokenBrokerService,
    {
      provide: TokenBrokerCacheStore,
      useClass: RedisTokenBrokerCacheStore,
    },
  ],
})
export class TokenBrokerModule {}
