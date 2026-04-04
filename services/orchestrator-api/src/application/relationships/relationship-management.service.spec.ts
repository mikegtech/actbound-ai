import { describe, it, expect, vi, beforeEach } from "vitest";
import { RelationshipManagementService } from "./relationship-management.service";
import type {
  RelationshipWriter,
  RelationshipWriteResult,
} from "@actbound/openfga";

function mockWriter(): RelationshipWriter {
  return {
    write: vi.fn(
      async (): Promise<RelationshipWriteResult> => ({
        tuple: { user: "", relation: "", object: "" },
        action: "write",
        result: "ok",
      }),
    ),
    delete: vi.fn(
      async (): Promise<RelationshipWriteResult> => ({
        tuple: { user: "", relation: "", object: "" },
        action: "delete",
        result: "ok",
      }),
    ),
    check: vi.fn(async (): Promise<boolean> => false),
  } as unknown as RelationshipWriter;
}

describe("RelationshipManagementService", () => {
  let service: RelationshipManagementService;
  let writer: ReturnType<typeof mockWriter>;

  beforeEach(() => {
    writer = mockWriter();
    service = new RelationshipManagementService(writer);
  });

  // ── Grant ───────────────────────────────────────────────

  describe("grant", () => {
    it("writes a member tuple for a user → organization", async () => {
      const result = await service.grant({
        subjectType: "user",
        subjectId: "alice",
        relation: "member",
        objectType: "organization",
        objectId: "acme",
      });

      expect(result.success).toBe(true);
      expect(result.operation).toBe("grant");
      expect(result.detail).toBe("ok");
      expect(vi.mocked(writer.write)).toHaveBeenCalledWith({
        user: "user:alice",
        relation: "member",
        object: "organization:acme",
      });
    });

    it("maps assistant to agent in OpenFGA tuples", async () => {
      await service.grant({
        subjectType: "assistant",
        subjectId: "research-001",
        relation: "member",
        objectType: "organization",
        objectId: "acme",
      });

      expect(vi.mocked(writer.write)).toHaveBeenCalledWith({
        user: "agent:research-001",
        relation: "member",
        object: "organization:acme",
      });
    });

    it("treats already_exists as success", async () => {
      vi.mocked(writer.write).mockResolvedValueOnce({
        tuple: { user: "", relation: "", object: "" },
        action: "write",
        result: "already_exists",
      });

      const result = await service.grant({
        subjectType: "user",
        subjectId: "alice",
        relation: "admin",
        objectType: "organization",
        objectId: "acme",
      });

      expect(result.success).toBe(true);
      expect(result.detail).toBe("already_exists");
    });

    it("rejects invalid relation for organization", async () => {
      await expect(
        service.grant({
          subjectType: "user",
          subjectId: "alice",
          relation: "owner",
          objectType: "organization",
          objectId: "acme",
        }),
      ).rejects.toThrow("Invalid relation");
    });

    it("rejects invalid relation for resource", async () => {
      await expect(
        service.grant({
          subjectType: "user",
          subjectId: "alice",
          relation: "admin",
          objectType: "resource",
          objectId: "proj-1",
        }),
      ).rejects.toThrow("Invalid relation");
    });

    it("allows viewer and editor for resources", async () => {
      await service.grant({
        subjectType: "user",
        subjectId: "alice",
        relation: "viewer",
        objectType: "resource",
        objectId: "proj-1",
      });

      await service.grant({
        subjectType: "assistant",
        subjectId: "bot-1",
        relation: "editor",
        objectType: "resource",
        objectId: "proj-1",
      });

      expect(vi.mocked(writer.write)).toHaveBeenCalledTimes(2);
    });
  });

  // ── Revoke ──────────────────────────────────────────────

  describe("revoke", () => {
    it("deletes a member tuple", async () => {
      const result = await service.revoke({
        subjectType: "user",
        subjectId: "bob",
        relation: "member",
        objectType: "organization",
        objectId: "acme",
      });

      expect(result.success).toBe(true);
      expect(result.operation).toBe("revoke");
      expect(vi.mocked(writer.delete)).toHaveBeenCalledWith({
        user: "user:bob",
        relation: "member",
        object: "organization:acme",
      });
    });

    it("treats not_found as success (idempotent revoke)", async () => {
      vi.mocked(writer.delete).mockResolvedValueOnce({
        tuple: { user: "", relation: "", object: "" },
        action: "delete",
        result: "not_found",
      });

      const result = await service.revoke({
        subjectType: "user",
        subjectId: "bob",
        relation: "admin",
        objectType: "organization",
        objectId: "acme",
      });

      expect(result.success).toBe(true);
      expect(result.detail).toBe("not_found");
    });

    it("maps assistant to agent on revoke", async () => {
      await service.revoke({
        subjectType: "assistant",
        subjectId: "bot-1",
        relation: "viewer",
        objectType: "resource",
        objectId: "proj-1",
      });

      expect(vi.mocked(writer.delete)).toHaveBeenCalledWith({
        user: "agent:bot-1",
        relation: "viewer",
        object: "resource:proj-1",
      });
    });
  });
});
