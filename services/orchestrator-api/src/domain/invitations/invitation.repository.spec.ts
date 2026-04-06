import { describe, it, expect } from "vitest";
import type {
  InvitationRecord,
  CreateInvitationInput,
  InvitationRepository,
} from "./invitation.repository";

class InMemoryInvitationRepository implements InvitationRepository {
  private store: InvitationRecord[] = [];

  async create(input: CreateInvitationInput): Promise<InvitationRecord> {
    const now = new Date().toISOString();
    const record: InvitationRecord = {
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
    this.store.push(record);
    return record;
  }

  async findById(id: string): Promise<InvitationRecord | null> {
    return this.store.find((r) => r.id === id) ?? null;
  }

  async findByTarget(targetSub: string): Promise<InvitationRecord[]> {
    return this.store.filter((r) => r.targetSub === targetSub);
  }

  async findByOrg(orgId: string): Promise<InvitationRecord[]> {
    return this.store.filter((r) => r.organizationId === orgId);
  }

  async accept(id: string): Promise<InvitationRecord | null> {
    const record = this.store.find((r) => r.id === id);
    if (!record) return null;
    record.status = "accepted";
    record.acceptedAt = new Date().toISOString();
    return record;
  }

  async revoke(id: string): Promise<InvitationRecord | null> {
    const record = this.store.find((r) => r.id === id);
    if (!record) return null;
    record.status = "revoked";
    record.revokedAt = new Date().toISOString();
    return record;
  }
}

describe("InvitationRepository", () => {
  it("creates a pending invitation", async () => {
    const repo = new InMemoryInvitationRepository();
    const inv = await repo.create({
      id: "inv-001",
      organizationId: "org-acme",
      targetEmail: "bob@example.com",
      invitedBy: "alice",
    });

    expect(inv.status).toBe("pending");
    expect(inv.organizationId).toBe("org-acme");
  });

  it("pending invitation does NOT imply active access", async () => {
    const repo = new InMemoryInvitationRepository();
    const inv = await repo.create({
      id: "inv-002",
      targetSub: "bob",
      organizationId: "org-acme",
    });

    // This is a data model test: status is pending, not accepted.
    // OpenFGA relations should NOT be created from pending invitations.
    expect(inv.status).toBe("pending");
    expect(inv.acceptedAt).toBeUndefined();
  });

  it("accepts an invitation and sets acceptedAt", async () => {
    const repo = new InMemoryInvitationRepository();
    await repo.create({ id: "inv-003", targetSub: "bob" });

    const accepted = await repo.accept("inv-003");
    expect(accepted!.status).toBe("accepted");
    expect(accepted!.acceptedAt).toBeDefined();
  });

  it("revokes an invitation", async () => {
    const repo = new InMemoryInvitationRepository();
    await repo.create({ id: "inv-004", targetSub: "bob" });

    const revoked = await repo.revoke("inv-004");
    expect(revoked!.status).toBe("revoked");
    expect(revoked!.revokedAt).toBeDefined();
  });

  it("finds invitations by target", async () => {
    const repo = new InMemoryInvitationRepository();
    await repo.create({ id: "i1", targetSub: "bob" });
    await repo.create({ id: "i2", targetSub: "bob" });
    await repo.create({ id: "i3", targetSub: "alice" });

    const bobs = await repo.findByTarget("bob");
    expect(bobs).toHaveLength(2);
  });
});
