import { Module } from "@nestjs/common";

import { TokenBrokerController } from "./token-broker.controller";
import { TokenBrokerService } from "./token-broker.service";

@Module({
  controllers: [TokenBrokerController],
  providers: [TokenBrokerService],
})
export class TokenBrokerModule {}
