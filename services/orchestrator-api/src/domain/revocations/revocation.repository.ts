/**
 * Revocation repository interface — domain layer.
 * Business record of revoked access/delegation/ownership.
 * OpenFGA reflects current active access; this table keeps the operational record.
 */

export interface RevocationRecord {
  id: string;
  tenantId: string;
  organizationId?: string;
  resourceId?: string;
  subjectSub?: string;
  assistantId?: string;
  revocationType: string;
  reason?: string;
  revokedBy?: string;
  effectiveAt: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface CreateRevocationInput {
  id: string;
  tenantId?: string;
  organizationId?: string;
  resourceId?: string;
  subjectSub?: string;
  assistantId?: string;
  revocationType: string;
  reason?: string;
  revokedBy?: string;
  metadata?: Record<string, unknown>;
}

export interface RevocationRepository {
  create(input: CreateRevocationInput): Promise<RevocationRecord>;
  findByResource(resourceId: string): Promise<RevocationRecord[]>;
  findBySubject(subjectSub: string): Promise<RevocationRecord[]>;
}
