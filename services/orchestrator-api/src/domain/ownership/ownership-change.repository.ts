/**
 * Ownership change repository interface — domain layer.
 * Rich ownership history belongs in app DB, not only as audit payloads.
 */

export interface OwnershipChangeRecord {
  id: string;
  tenantId: string;
  resourceId: string;
  previousOwnerType?: string;
  previousOwnerId?: string;
  newOwnerType: string;
  newOwnerId: string;
  changedBy?: string;
  reason?: string;
  createdAt: string;
}

export interface CreateOwnershipChangeInput {
  id: string;
  tenantId?: string;
  resourceId: string;
  previousOwnerType?: string;
  previousOwnerId?: string;
  newOwnerType: string;
  newOwnerId: string;
  changedBy?: string;
  reason?: string;
}

export interface OwnershipChangeRepository {
  create(input: CreateOwnershipChangeInput): Promise<OwnershipChangeRecord>;
  findByResource(resourceId: string): Promise<OwnershipChangeRecord[]>;
}
