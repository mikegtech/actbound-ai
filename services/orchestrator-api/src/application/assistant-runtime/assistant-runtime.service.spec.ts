import { describe, it, expect, vi, beforeEach } from "vitest";
import { AssistantRuntimeService } from "./assistant-runtime.service";
import type { AuditWriter, AuditEventInput } from "@actbound/sdk";
import type {
  AssistantRepository,
  AssistantRecord,
} from "../../domain/assistants/assistant.repository";
import type { RelationshipWriter } from "@actbound/openfga";

function mockAuditWriter(): AuditWriter & {
  events: Array<{ eventType: string }>;
} {
  const events: Array<{ eventType: string }> = [];
  return {
    events,
    record: vi.fn(
      async (_r: string, _t: string, _s: string, e: AuditEventInput) => {
        events.push({ eventType: e.eventType });
      },
    ),
  };
}

function mockFga(checkResult = false): RelationshipWriter {
  return {
    write: vi.fn(),
    delete: vi.fn(),
    check: vi.fn(async () => checkResult),
    readTuples: vi.fn(async () => []),
    listRelatedSubjects: vi.fn(async () => []),
  } as unknown as RelationshipWriter;
}

function mockRepo(list: AssistantRecord[] = []): AssistantRepository {
  const store = [...list];
  return {
    create: vi.fn(),
    findById: vi.fn(
      async (id: string) => store.find((a) => a.id === id) ?? null,
    ),
    findByOrg: vi.fn(async () => []),
    updateStatus: vi.fn(async (id: string, status: string) => {
      const a = store.find((x) => x.id === id);
      if (a) a.status = status;
      return a ?? null;
    }),
  };
}

function active(id: string, tenantId = "default"): AssistantRecord {
  const now = new Date().toISOString();
  return {
    id,
    tenantId,
    name: id,
    assistantType: "general",
    runtimeMode: "managed",
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
}

describe("AssistantRuntimeService", () => {
  let service: AssistantRuntimeService;
  let writer: ReturnType<typeof mockAuditWriter>;
  let repo: ReturnType<typeof mockRepo>;
  let fga: RelationshipWriter;

  beforeEach(() => {
    writer = mockAuditWriter();
    repo = mockRepo([
      active("ast-001"),
      { ...active("ast-disabled"), status: "disabled" },
      active("ast-other", "other-tenant"),
    ]);
    fga = mockFga(false);
    service = new AssistantRuntimeService(writer, repo, fga);
    // Clear any per-assistant allowlists from prior tests
    service.setAssistantToolAllowlist("ast-001", "*");
  });

  function ctx(tenantId = "default") {
    return service.buildContext(
      {
        sub: "user:alice",
        principalType: "user",
        roles: ["operator"],
        tenantId,
        authenticated: true,
      },
      "req-1",
      "wf-1",
    );
  }

  // ── Invocation ──────────────────────────────────────────

  it("allows active assistant", async () => {
    expect(
      (
        await service.execute(ctx(), {
          assistantId: "ast-001",
          actionName: "a",
          executionMode: "independent",
        })
      ).status,
    ).toBe("completed");
  });

  it("denies disabled", async () => {
    const r = await service.execute(ctx(), {
      assistantId: "ast-disabled",
      actionName: "a",
      executionMode: "independent",
    });
    expect(r.reasons).toContainEqual(
      expect.objectContaining({ code: "assistant_disabled" }),
    );
  });

  it("denies not found", async () => {
    const r = await service.execute(ctx(), {
      assistantId: "nope",
      actionName: "a",
      executionMode: "independent",
    });
    expect(r.reasons).toContainEqual(
      expect.objectContaining({ code: "assistant_not_found" }),
    );
  });

  it("denies wrong tenant", async () => {
    const r = await service.execute(ctx(), {
      assistantId: "ast-other",
      actionName: "a",
      executionMode: "independent",
    });
    expect(r.reasons).toContainEqual(
      expect.objectContaining({ code: "tenant_mismatch" }),
    );
  });

  // ── OpenFGA delegation ──────────────────────────────────

  it("denies delegated without onBehalfOf", async () => {
    const r = await service.execute(ctx(), {
      assistantId: "ast-001",
      actionName: "a",
      executionMode: "delegated",
    });
    expect(r.reasons).toContainEqual(
      expect.objectContaining({ code: "delegation_missing" }),
    );
  });

  it("denies delegated when OpenFGA denies user resource access", async () => {
    vi.mocked(fga.check).mockResolvedValue(false);
    const r = await service.execute(ctx(), {
      assistantId: "ast-001",
      actionName: "a",
      executionMode: "delegated",
      onBehalfOf: "bob",
      targetResourceType: "resource",
      targetResourceId: "proj-1",
    });
    expect(r.reasons).toContainEqual(
      expect.objectContaining({ code: "delegation_user_lacks_access" }),
    );
    expect(vi.mocked(fga.check)).toHaveBeenCalledWith({
      user: "user:bob",
      relation: "viewer",
      object: "resource:proj-1",
    });
  });

  it("allows delegated when OpenFGA confirms user access", async () => {
    vi.mocked(fga.check).mockResolvedValue(true);
    const r = await service.execute(ctx(), {
      assistantId: "ast-001",
      actionName: "a",
      executionMode: "delegated",
      onBehalfOf: "bob",
      targetResourceType: "resource",
      targetResourceId: "proj-1",
    });
    expect(r.status).toBe("completed");
  });

  it("fails closed when OpenFGA unavailable", async () => {
    vi.mocked(fga.check).mockRejectedValue(new Error("timeout"));
    const r = await service.execute(ctx(), {
      assistantId: "ast-001",
      actionName: "a",
      executionMode: "delegated",
      onBehalfOf: "bob",
      targetResourceType: "resource",
      targetResourceId: "proj-1",
    });
    expect(r.status).toBe("failed");
  });

  // ── Tool registry ───────────────────────────────────────

  it("denies unregistered tool", async () => {
    const r = await service.execute(ctx(), {
      assistantId: "ast-001",
      actionName: "a",
      executionMode: "independent",
      toolName: "unknown",
    });
    expect(r.reasons).toContainEqual(
      expect.objectContaining({ code: "tool_not_registered" }),
    );
  });

  it("denies disabled tool", async () => {
    const r = await service.execute(ctx(), {
      assistantId: "ast-001",
      actionName: "a",
      executionMode: "independent",
      toolName: "deprecated-tool",
    });
    expect(r.reasons).toContainEqual(
      expect.objectContaining({ code: "tool_disabled" }),
    );
  });

  it("denies tool not in assistant allowlist", async () => {
    service.setAssistantToolAllowlist("ast-001", ["read-internal"]);
    const r = await service.execute(ctx(), {
      assistantId: "ast-001",
      actionName: "a",
      executionMode: "independent",
      toolName: "write-internal",
    });
    expect(r.reasons).toContainEqual(
      expect.objectContaining({ code: "tool_not_allowed_for_assistant" }),
    );
  });

  it("allows tool in assistant allowlist", async () => {
    service.setAssistantToolAllowlist("ast-001", ["read-internal"]);
    expect(
      (
        await service.execute(ctx(), {
          assistantId: "ast-001",
          actionName: "a",
          executionMode: "independent",
          toolName: "read-internal",
        })
      ).status,
    ).toBe("completed");
  });

  it("denies external tool without delegation", async () => {
    const r = await service.execute(ctx(), {
      assistantId: "ast-001",
      actionName: "a",
      executionMode: "independent",
      toolName: "read-external",
    });
    expect(r.reasons).toContainEqual(
      expect.objectContaining({ code: "delegation_required_for_tool" }),
    );
  });

  // ── Secret boundary ─────────────────────────────────────

  it("denies forbidden secret", async () => {
    const r = await service.execute(ctx(), {
      assistantId: "ast-001",
      actionName: "a",
      executionMode: "independent",
      secretCategory: "database-credentials",
    });
    expect(r.reasons).toContainEqual(
      expect.objectContaining({ code: "secret_access_denied" }),
    );
  });

  it("allows permitted secret", async () => {
    expect(
      (
        await service.execute(ctx(), {
          assistantId: "ast-001",
          actionName: "a",
          executionMode: "independent",
          secretCategory: "platform-api-key",
        })
      ).status,
    ).toBe("completed");
  });

  // ── Kill-switch ─────────────────────────────────────────

  it("kill-switch disables assistant and blocks subsequent invocations", async () => {
    const k = await service.disableAssistant("ast-001", "admin", ctx());
    expect(k.success).toBe(true);
    expect(k.previousStatus).toBe("active");

    const r = await service.execute(ctx(), {
      assistantId: "ast-001",
      actionName: "a",
      executionMode: "independent",
    });
    expect(r.status).toBe("denied");
    expect(r.reasons).toContainEqual(
      expect.objectContaining({ code: "assistant_disabled" }),
    );
  });

  it("kill-switch emits audit event", async () => {
    await service.disableAssistant("ast-001", "admin", ctx());
    expect(writer.events.some((e) => e.eventType === "assistant.killed")).toBe(
      true,
    );
  });

  it("post-kill invocation emits denied audit event", async () => {
    await service.disableAssistant("ast-001", "admin", ctx());
    writer.events.length = 0; // clear kill events
    await service.execute(ctx(), {
      assistantId: "ast-001",
      actionName: "a",
      executionMode: "independent",
    });
    expect(writer.events.map((e) => e.eventType)).toEqual([
      "assistant.action.requested",
      "assistant.action.denied",
    ]);
  });

  // ── Audit trails ────────────────────────────────────────

  it("success: requested + completed", async () => {
    await service.execute(ctx(), {
      assistantId: "ast-001",
      actionName: "a",
      executionMode: "independent",
    });
    expect(writer.events.map((e) => e.eventType)).toEqual([
      "assistant.action.requested",
      "assistant.action.completed",
    ]);
  });

  it("denial: requested + denied", async () => {
    await service.execute(ctx(), {
      assistantId: "ast-disabled",
      actionName: "a",
      executionMode: "independent",
    });
    expect(writer.events.map((e) => e.eventType)).toEqual([
      "assistant.action.requested",
      "assistant.action.denied",
    ]);
  });

  it("failure: requested + failed", async () => {
    vi.mocked(repo.findById).mockRejectedValueOnce(new Error("DB down"));
    await service.execute(ctx(), {
      assistantId: "ast-001",
      actionName: "a",
      executionMode: "independent",
    });
    expect(writer.events.map((e) => e.eventType)).toEqual([
      "assistant.action.requested",
      "assistant.action.failed",
    ]);
  });

  // ── Correlation ─────────────────────────────────────────

  it("propagates requestId and workflowId", async () => {
    const c = ctx();
    expect(c.requestId).toBe("req-1");
    expect(c.workflowId).toBe("wf-1");
    await service.execute(c, {
      assistantId: "ast-001",
      actionName: "a",
      executionMode: "independent",
    });
    expect(vi.mocked(writer.record)).toHaveBeenCalledWith(
      "req-1",
      expect.any(String),
      expect.any(String),
      expect.anything(),
    );
  });
});
