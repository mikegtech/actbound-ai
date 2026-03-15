import type {
  ConsentSummary,
  ProviderConnection,
  VaultSession,
} from "@actbound/sdk";

export type DelegatedAccessSnapshot = {
  connections: ProviderConnection[];
  consents: ConsentSummary[];
  sessions: VaultSession[];
};

export abstract class DelegatedAccessSnapshotStore {
  abstract get(subjectId: string): DelegatedAccessSnapshot | undefined;
  abstract set(subjectId: string, snapshot: DelegatedAccessSnapshot): void;
}
