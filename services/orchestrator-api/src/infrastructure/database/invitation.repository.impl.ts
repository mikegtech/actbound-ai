import { Injectable, Logger } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { getDb } from "./connection";
import { invitations } from "./schema";
import type {
  InvitationRecord,
  CreateInvitationInput,
  InvitationRepository,
} from "../../domain/invitations/invitation.repository";

@Injectable()
export class PostgresInvitationRepository implements InvitationRepository {
  private readonly logger = new Logger(PostgresInvitationRepository.name);

  async create(input: CreateInvitationInput): Promise<InvitationRecord> {
    const db = getDb();
    if (!db) return this.toFallback(input);

    const [row] = await db
      .insert(invitations)
      .values({
        id: input.id,
        tenantId: input.tenantId ?? "default",
        organizationId: input.organizationId,
        resourceId: input.resourceId,
        targetSub: input.targetSub,
        targetEmail: input.targetEmail,
        invitationType: input.invitationType ?? "membership",
        invitedBy: input.invitedBy,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
        metadata: input.metadata ?? {},
      })
      .returning();

    return this.toRecord(row!);
  }

  async findById(id: string): Promise<InvitationRecord | null> {
    const db = getDb();
    if (!db) return null;
    const [row] = await db
      .select()
      .from(invitations)
      .where(eq(invitations.id, id))
      .limit(1);
    return row ? this.toRecord(row) : null;
  }

  async findByTarget(targetSub: string): Promise<InvitationRecord[]> {
    const db = getDb();
    if (!db) return [];
    return (
      await db
        .select()
        .from(invitations)
        .where(eq(invitations.targetSub, targetSub))
    ).map((r) => this.toRecord(r));
  }

  async findByOrg(orgId: string): Promise<InvitationRecord[]> {
    const db = getDb();
    if (!db) return [];
    return (
      await db
        .select()
        .from(invitations)
        .where(eq(invitations.organizationId, orgId))
    ).map((r) => this.toRecord(r));
  }

  async accept(id: string): Promise<InvitationRecord | null> {
    const db = getDb();
    if (!db) return null;
    const [row] = await db
      .update(invitations)
      .set({
        status: "accepted",
        acceptedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(invitations.id, id))
      .returning();
    return row ? this.toRecord(row) : null;
  }

  async revoke(id: string): Promise<InvitationRecord | null> {
    const db = getDb();
    if (!db) return null;
    const [row] = await db
      .update(invitations)
      .set({ status: "revoked", revokedAt: new Date(), updatedAt: new Date() })
      .where(eq(invitations.id, id))
      .returning();
    return row ? this.toRecord(row) : null;
  }

  private toRecord(row: typeof invitations.$inferSelect): InvitationRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      organizationId: row.organizationId ?? undefined,
      resourceId: row.resourceId ?? undefined,
      targetSub: row.targetSub ?? undefined,
      targetEmail: row.targetEmail ?? undefined,
      invitationType: row.invitationType,
      status: row.status as InvitationRecord["status"],
      invitedBy: row.invitedBy ?? undefined,
      expiresAt: row.expiresAt?.toISOString(),
      acceptedAt: row.acceptedAt?.toISOString(),
      revokedAt: row.revokedAt?.toISOString(),
      metadata: (row.metadata as Record<string, unknown>) ?? {},
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toFallback(input: CreateInvitationInput): InvitationRecord {
    const now = new Date().toISOString();
    return {
      id: input.id,
      tenantId: input.tenantId ?? "default",
      organizationId: input.organizationId,
      resourceId: input.resourceId,
      targetSub: input.targetSub,
      targetEmail: input.targetEmail,
      invitationType: input.invitationType ?? "membership",
      status: "pending",
      invitedBy: input.invitedBy,
      expiresAt: input.expiresAt,
      metadata: input.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    };
  }
}
