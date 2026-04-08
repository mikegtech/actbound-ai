import { Module } from "@nestjs/common";
import { SyncQueue } from "./infrastructure/queue/sync-queue";
import { SyncProcessor } from "./application/sync/sync-processor";
import { HealthController } from "./modules/health.controller";
import { SyncController } from "./modules/sync.controller";

@Module({
  controllers: [HealthController, SyncController],
  providers: [SyncQueue, SyncProcessor],
})
export class AppModule {}
