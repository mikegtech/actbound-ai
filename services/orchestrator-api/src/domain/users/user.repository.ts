/**
 * User projection repository interface — domain layer.
 * App-local projection of Auth0 identities. Not a full identity store.
 */

export interface UserRecord {
  sub: string;
  tenantId: string;
  displayName?: string;
  email?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertUserInput {
  sub: string;
  tenantId?: string;
  displayName?: string;
  email?: string;
}

export interface UserRepository {
  upsert(input: UpsertUserInput): Promise<UserRecord>;
  findBySub(sub: string): Promise<UserRecord | null>;
  findByTenant(tenantId: string): Promise<UserRecord[]>;
}
