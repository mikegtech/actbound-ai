/**
 * Organization repository interface — domain layer.
 * No Drizzle, no pg imports. Pure TypeScript.
 */

export interface OrganizationRecord {
  id: string;
  tenantId: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationInput {
  id: string;
  tenantId?: string;
  name: string;
}

export interface OrganizationRepository {
  create(input: CreateOrganizationInput): Promise<OrganizationRecord>;
  findById(id: string): Promise<OrganizationRecord | null>;
  findByTenant(tenantId: string): Promise<OrganizationRecord[]>;
}
