/**
 * Invitation repository interface — domain layer.
 * Authoritative source of truth for invitation lifecycle state.
 * OpenFGA relations are NOT created from pending invitations.
 */

export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export interface InvitationRecord {
  id: string;
  tenantId: string;
  organizationId?: string;
  resourceId?: string;
  targetSub?: string;
  targetEmail?: string;
  invitationType: string;
  status: InvitationStatus;
  invitedBy?: string;
  expiresAt?: string;
  acceptedAt?: string;
  revokedAt?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvitationInput {
  id: string;
  tenantId?: string;
  organizationId?: string;
  resourceId?: string;
  targetSub?: string;
  targetEmail?: string;
  invitationType?: string;
  invitedBy?: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

export interface InvitationRepository {
  create(input: CreateInvitationInput): Promise<InvitationRecord>;
  findById(id: string): Promise<InvitationRecord | null>;
  findByTarget(targetSub: string): Promise<InvitationRecord[]>;
  findByOrg(orgId: string): Promise<InvitationRecord[]>;
  accept(id: string): Promise<InvitationRecord | null>;
  revoke(id: string): Promise<InvitationRecord | null>;
}
