/**
 * Resource repository interface — domain layer.
 * No Drizzle, no pg imports. Pure TypeScript.
 */

export interface ResourceRecord {
  id: string;
  tenantId: string;
  organizationId?: string;
  resourceType: string;
  displayName: string;
  status: string;
  ownerType?: string;
  ownerId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResourceInput {
  id: string;
  tenantId?: string;
  organizationId?: string;
  resourceType?: string;
  displayName: string;
  ownerType?: string;
  ownerId?: string;
  metadata?: Record<string, unknown>;
}

export interface ResourceRepository {
  create(input: CreateResourceInput): Promise<ResourceRecord>;
  findById(id: string): Promise<ResourceRecord | null>;
  findByOrg(orgId: string): Promise<ResourceRecord[]>;
  findByOwner(ownerType: string, ownerId: string): Promise<ResourceRecord[]>;
}
