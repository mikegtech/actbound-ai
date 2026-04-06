/**
 * Assistant repository interface — domain layer.
 * No Drizzle, no pg imports. Pure TypeScript.
 */

export interface AssistantRecord {
  id: string;
  tenantId: string;
  organizationId?: string;
  name: string;
  assistantType: string;
  runtimeMode: string;
  status: string;
  description?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssistantInput {
  id: string;
  tenantId?: string;
  organizationId?: string;
  name: string;
  assistantType?: string;
  runtimeMode?: string;
  description?: string;
  createdBy?: string;
}

export interface AssistantRepository {
  create(input: CreateAssistantInput): Promise<AssistantRecord>;
  findById(id: string): Promise<AssistantRecord | null>;
  findByOrg(orgId: string): Promise<AssistantRecord[]>;
  updateStatus(
    id: string,
    status: string,
    updatedBy?: string,
  ): Promise<AssistantRecord | null>;
}
