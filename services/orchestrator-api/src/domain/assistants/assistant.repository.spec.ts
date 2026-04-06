import { describe, it, expect } from "vitest";
import type {
  AssistantRecord,
  CreateAssistantInput,
  AssistantRepository,
} from "./assistant.repository";

/** In-memory implementation for unit testing. */
class InMemoryAssistantRepository implements AssistantRepository {
  private store: AssistantRecord[] = [];

  async create(input: CreateAssistantInput): Promise<AssistantRecord> {
    const now = new Date().toISOString();
    const record: AssistantRecord = {
      id: input.id,
      tenantId: input.tenantId ?? "default",
      organizationId: input.organizationId,
      name: input.name,
      assistantType: input.assistantType ?? "general",
      runtimeMode: input.runtimeMode ?? "managed",
      status: "active",
      description: input.description,
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    };
    this.store.push(record);
    return record;
  }

  async findById(id: string): Promise<AssistantRecord | null> {
    return this.store.find((r) => r.id === id) ?? null;
  }

  async findByOrg(orgId: string): Promise<AssistantRecord[]> {
    return this.store.filter((r) => r.organizationId === orgId);
  }

  async updateStatus(
    id: string,
    status: string,
    updatedBy?: string,
  ): Promise<AssistantRecord | null> {
    const record = this.store.find((r) => r.id === id);
    if (!record) return null;
    record.status = status;
    record.updatedBy = updatedBy;
    record.updatedAt = new Date().toISOString();
    return record;
  }
}

describe("AssistantRepository", () => {
  it("creates and retrieves an assistant", async () => {
    const repo = new InMemoryAssistantRepository();

    const created = await repo.create({
      id: "ast-001",
      name: "Finance Bot",
      assistantType: "financial",
      organizationId: "org-acme",
      createdBy: "admin",
    });

    expect(created.id).toBe("ast-001");
    expect(created.name).toBe("Finance Bot");
    expect(created.status).toBe("active");
    expect(created.organizationId).toBe("org-acme");

    const found = await repo.findById("ast-001");
    expect(found).not.toBeNull();
    expect(found!.name).toBe("Finance Bot");
  });

  it("finds assistants by organization", async () => {
    const repo = new InMemoryAssistantRepository();

    await repo.create({ id: "a1", name: "Bot A", organizationId: "org-1" });
    await repo.create({ id: "a2", name: "Bot B", organizationId: "org-1" });
    await repo.create({ id: "a3", name: "Bot C", organizationId: "org-2" });

    const org1 = await repo.findByOrg("org-1");
    expect(org1).toHaveLength(2);

    const org2 = await repo.findByOrg("org-2");
    expect(org2).toHaveLength(1);
  });

  it("updates assistant status (disable/enable)", async () => {
    const repo = new InMemoryAssistantRepository();
    await repo.create({ id: "a1", name: "Bot", organizationId: "org-1" });

    const disabled = await repo.updateStatus("a1", "disabled", "admin");
    expect(disabled!.status).toBe("disabled");

    const enabled = await repo.updateStatus("a1", "active", "admin");
    expect(enabled!.status).toBe("active");
  });

  it("returns null for non-existent assistant", async () => {
    const repo = new InMemoryAssistantRepository();
    const result = await repo.findById("does-not-exist");
    expect(result).toBeNull();
  });
});
