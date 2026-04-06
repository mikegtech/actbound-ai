import { describe, it, expect } from "vitest";
import type {
  ResourceRecord,
  CreateResourceInput,
  ResourceRepository,
} from "./resource.repository";

class InMemoryResourceRepository implements ResourceRepository {
  private store: ResourceRecord[] = [];

  async create(input: CreateResourceInput): Promise<ResourceRecord> {
    const now = new Date().toISOString();
    const record: ResourceRecord = {
      id: input.id,
      tenantId: input.tenantId ?? "default",
      organizationId: input.organizationId,
      resourceType: input.resourceType ?? "document",
      displayName: input.displayName,
      status: "active",
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      metadata: input.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    };
    this.store.push(record);
    return record;
  }

  async findById(id: string): Promise<ResourceRecord | null> {
    return this.store.find((r) => r.id === id) ?? null;
  }

  async findByOrg(orgId: string): Promise<ResourceRecord[]> {
    return this.store.filter((r) => r.organizationId === orgId);
  }

  async findByOwner(
    ownerType: string,
    ownerId: string,
  ): Promise<ResourceRecord[]> {
    return this.store.filter(
      (r) => r.ownerType === ownerType && r.ownerId === ownerId,
    );
  }
}

describe("ResourceRepository", () => {
  it("creates and retrieves a resource", async () => {
    const repo = new InMemoryResourceRepository();

    const created = await repo.create({
      id: "res-001",
      displayName: "Financial Q3 Drafts",
      resourceType: "document",
      organizationId: "org-acme",
      ownerType: "user",
      ownerId: "alice",
    });

    expect(created.id).toBe("res-001");
    expect(created.displayName).toBe("Financial Q3 Drafts");
    expect(created.ownerType).toBe("user");

    const found = await repo.findById("res-001");
    expect(found).not.toBeNull();
  });

  it("finds resources by organization", async () => {
    const repo = new InMemoryResourceRepository();

    await repo.create({
      id: "r1",
      displayName: "Doc A",
      organizationId: "org-1",
    });
    await repo.create({
      id: "r2",
      displayName: "Doc B",
      organizationId: "org-1",
    });
    await repo.create({
      id: "r3",
      displayName: "Doc C",
      organizationId: "org-2",
    });

    expect(await repo.findByOrg("org-1")).toHaveLength(2);
    expect(await repo.findByOrg("org-2")).toHaveLength(1);
  });

  it("finds resources by owner", async () => {
    const repo = new InMemoryResourceRepository();

    await repo.create({
      id: "r1",
      displayName: "My Doc",
      ownerType: "user",
      ownerId: "alice",
    });
    await repo.create({
      id: "r2",
      displayName: "Bot Doc",
      ownerType: "assistant",
      ownerId: "bot-1",
    });

    const aliceDocs = await repo.findByOwner("user", "alice");
    expect(aliceDocs).toHaveLength(1);
    expect(aliceDocs[0]!.displayName).toBe("My Doc");
  });
});
