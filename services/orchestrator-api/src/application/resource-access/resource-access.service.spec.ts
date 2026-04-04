import { describe, it, expect, vi, beforeEach } from "vitest";
import { ResourceAccessService } from "./resource-access.service";
import type { ResourceRelation } from "../../domain/relationships/types";
import type {
  RelationshipWriter,
  RelationshipTuple,
  RelationshipWriteResult,
} from "@actbound/openfga";

function mockWriter() {
  const writtenTuples: RelationshipTuple[] = [];

  return {
    write: vi.fn(
      async (tuple: RelationshipTuple): Promise<RelationshipWriteResult> => {
        writtenTuples.push(tuple);
        return { tuple, action: "write", result: "ok" };
      },
    ),
    delete: vi.fn(
      async (tuple: RelationshipTuple): Promise<RelationshipWriteResult> => ({
        tuple,
        action: "delete",
        result: "ok",
      }),
    ),
    check: vi.fn(async (): Promise<boolean> => false),
    readTuples: vi.fn(async (): Promise<RelationshipTuple[]> => []),
    listRelatedSubjects: vi.fn(async (): Promise<string[]> => []),
    _writtenTuples: writtenTuples,
  } as unknown as RelationshipWriter & { _writtenTuples: RelationshipTuple[] };
}

describe("ResourceAccessService", () => {
  let service: ResourceAccessService;
  let writer: ReturnType<typeof mockWriter>;

  beforeEach(() => {
    writer = mockWriter();
    service = new ResourceAccessService(writer);
  });

  // ── Grant Access ────────────────────────────────────────

  describe("grantAccess", () => {
    it("grants user viewer access", async () => {
      const result = await service.grantAccess({
        resourceId: "proj-1",
        subjectType: "user",
        subjectId: "alice",
        accessLevel: "viewer",
      });

      expect(result.success).toBe(true);
      expect(vi.mocked(writer.write)).toHaveBeenCalledWith({
        user: "user:alice",
        relation: "viewer",
        object: "resource:proj-1",
      });
    });

    it("grants assistant operator access (maps to agent in FGA)", async () => {
      const result = await service.grantAccess({
        resourceId: "proj-1",
        subjectType: "assistant",
        subjectId: "bot-1",
        accessLevel: "operator",
      });

      expect(result.success).toBe(true);
      expect(vi.mocked(writer.write)).toHaveBeenCalledWith({
        user: "agent:bot-1",
        relation: "operator",
        object: "resource:proj-1",
      });
    });

    it("grants organization viewer access", async () => {
      const result = await service.grantAccess({
        resourceId: "proj-1",
        subjectType: "organization",
        subjectId: "acme",
        accessLevel: "viewer",
      });

      expect(result.success).toBe(true);
      expect(vi.mocked(writer.write)).toHaveBeenCalledWith({
        user: "organization:acme",
        relation: "viewer",
        object: "resource:proj-1",
      });
    });

    it("rejects invalid access level for user", async () => {
      await expect(
        service.grantAccess({
          resourceId: "proj-1",
          subjectType: "user",
          subjectId: "alice",
          accessLevel: "operator" as ResourceRelation,
        }),
      ).rejects.toThrow("Invalid access level");
    });

    it("rejects invalid access level for assistant", async () => {
      await expect(
        service.grantAccess({
          resourceId: "proj-1",
          subjectType: "assistant",
          subjectId: "bot-1",
          accessLevel: "editor" as ResourceRelation,
        }),
      ).rejects.toThrow("Invalid access level");
    });
  });

  // ── Revoke Access ───────────────────────────────────────

  describe("revokeAccess", () => {
    it("revokes all user relations", async () => {
      await service.revokeAccess({
        resourceId: "proj-1",
        subjectType: "user",
        subjectId: "alice",
      });

      // Should attempt to delete viewer and editor
      expect(vi.mocked(writer.delete)).toHaveBeenCalledTimes(2);
    });

    it("revokes all assistant relations", async () => {
      await service.revokeAccess({
        resourceId: "proj-1",
        subjectType: "assistant",
        subjectId: "bot-1",
      });

      // Should attempt to delete viewer and operator
      expect(vi.mocked(writer.delete)).toHaveBeenCalledTimes(2);
      expect(vi.mocked(writer.delete)).toHaveBeenCalledWith(
        expect.objectContaining({
          user: "agent:bot-1",
          relation: "operator",
        }),
      );
    });
  });

  // ── Get Resource Access ─────────────────────────────────

  describe("getResourceAccess", () => {
    it("returns direct user, assistant, and org access", async () => {
      vi.mocked(writer.readTuples).mockResolvedValueOnce([
        { user: "user:alice", relation: "editor", object: "resource:proj-1" },
        { user: "agent:bot-1", relation: "viewer", object: "resource:proj-1" },
        {
          user: "organization:acme",
          relation: "viewer",
          object: "resource:proj-1",
        },
      ]);

      // Mock org membership read for inherited access calculation
      vi.mocked(writer.readTuples).mockResolvedValueOnce([
        {
          user: "user:bob",
          relation: "member",
          object: "organization:acme",
        },
      ]);

      const result = await service.getResourceAccess("proj-1");

      expect(result.users).toHaveLength(2); // alice direct + bob inherited
      expect(result.users[0]).toEqual({
        subjectType: "user",
        subjectId: "alice",
        accessLevel: "editor",
        source: "direct",
      });
      expect(result.users[1]).toEqual({
        subjectType: "user",
        subjectId: "bob",
        accessLevel: "viewer",
        source: "inherited",
        grantedVia: "organization:acme",
      });
      expect(result.assistants).toHaveLength(1);
      expect(result.assistants[0]!.subjectType).toBe("assistant");
      expect(result.organizations).toHaveLength(1);
    });

    it("does not duplicate user who has direct and inherited", async () => {
      vi.mocked(writer.readTuples).mockResolvedValueOnce([
        { user: "user:alice", relation: "editor", object: "resource:proj-1" },
        {
          user: "organization:acme",
          relation: "viewer",
          object: "resource:proj-1",
        },
      ]);

      vi.mocked(writer.readTuples).mockResolvedValueOnce([
        {
          user: "user:alice",
          relation: "admin",
          object: "organization:acme",
        },
      ]);

      const result = await service.getResourceAccess("proj-1");

      // alice has direct editor — should not also appear as inherited viewer
      const aliceEntries = result.users.filter((u) => u.subjectId === "alice");
      expect(aliceEntries).toHaveLength(1);
      expect(aliceEntries[0]!.source).toBe("direct");
    });
  });
});
