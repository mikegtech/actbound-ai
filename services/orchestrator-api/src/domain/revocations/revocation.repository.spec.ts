import { describe, it, expect } from "vitest";
import type {
  RevocationRecord,
  CreateRevocationInput,
  RevocationRepository,
} from "./revocation.repository";

class InMemoryRevocationRepository implements RevocationRepository {
  private store: RevocationRecord[] = [];

  async create(input: CreateRevocationInput): Promise<RevocationRecord> {
    const now = new Date().toISOString();
    const record: RevocationRecord = {
      id: input.id,
      tenantId: input.tenantId ?? "default",
      organizationId: input.organizationId,
      resourceId: input.resourceId,
      subjectSub: input.subjectSub,
      assistantId: input.assistantId,
      revocationType: input.revocationType,
      reason: input.reason,
      revokedBy: input.revokedBy,
      effectiveAt: now,
      metadata: input.metadata ?? {},
      createdAt: now,
    };
    this.store.push(record);
    return record;
  }

  async findByResource(resourceId: string): Promise<RevocationRecord[]> {
    return this.store.filter((r) => r.resourceId === resourceId);
  }

  async findBySubject(subjectSub: string): Promise<RevocationRecord[]> {
    return this.store.filter((r) => r.subjectSub === subjectSub);
  }
}

describe("RevocationRepository", () => {
  it("records a revocation", async () => {
    const repo = new InMemoryRevocationRepository();
    const rev = await repo.create({
      id: "rev-001",
      resourceId: "res-1",
      subjectSub: "bob",
      revocationType: "access",
      reason: "Policy violation",
      revokedBy: "admin",
    });

    expect(rev.revocationType).toBe("access");
    expect(rev.reason).toBe("Policy violation");
  });

  it("revocation record exists separately from relationship state", async () => {
    const repo = new InMemoryRevocationRepository();
    await repo.create({
      id: "rev-002",
      resourceId: "res-1",
      subjectSub: "bob",
      revocationType: "access",
    });

    // The revocation record is an operational/investigation record.
    // The actual relationship removal happens in OpenFGA separately.
    const revocations = await repo.findByResource("res-1");
    expect(revocations).toHaveLength(1);
    expect(revocations[0]!.subjectSub).toBe("bob");
  });

  it("finds revocations by subject", async () => {
    const repo = new InMemoryRevocationRepository();
    await repo.create({
      id: "r1",
      subjectSub: "bob",
      revocationType: "access",
    });
    await repo.create({
      id: "r2",
      subjectSub: "bob",
      revocationType: "delegation",
    });

    const bobs = await repo.findBySubject("bob");
    expect(bobs).toHaveLength(2);
  });
});
