import { Module } from "@nestjs/common";

import { DelegatedAccessService } from "../application/delegated-access/delegated-access.service";
import { DelegatedAccessSnapshotStore } from "../domain/delegated-access/delegated-access-snapshot.store";
import { InMemoryDelegatedAccessSnapshotStore } from "../infrastructure/delegated-access/in-memory-delegated-access-snapshot.store";
import { DelegatedAccessController } from "../presentation/http/controllers/delegated-access.controller";

@Module({
  controllers: [DelegatedAccessController],
  providers: [
    DelegatedAccessService,
    {
      provide: DelegatedAccessSnapshotStore,
      useClass: InMemoryDelegatedAccessSnapshotStore,
    },
  ],
  exports: [DelegatedAccessService],
})
export class DelegatedAccessModule {}
