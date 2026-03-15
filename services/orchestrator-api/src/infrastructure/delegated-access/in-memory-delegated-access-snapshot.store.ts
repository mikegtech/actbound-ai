import { Injectable } from "@nestjs/common";

import {
  DelegatedAccessSnapshotStore,
  type DelegatedAccessSnapshot,
} from "../../domain/delegated-access/delegated-access-snapshot.store";

@Injectable()
export class InMemoryDelegatedAccessSnapshotStore extends DelegatedAccessSnapshotStore {
  private readonly snapshots = new Map<string, DelegatedAccessSnapshot>();

  get(subjectId: string): DelegatedAccessSnapshot | undefined {
    return this.snapshots.get(subjectId);
  }

  set(subjectId: string, snapshot: DelegatedAccessSnapshot): void {
    this.snapshots.set(subjectId, snapshot);
  }
}
