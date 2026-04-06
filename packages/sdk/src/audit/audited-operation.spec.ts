import { describe, it, expect, vi } from "vitest";
import {
  executeAuditedOperation,
  OperationDeniedError,
} from "./audited-operation";
import type { ExecutionContext } from "./execution-context";
import type { AuditWriter, AuditEventInput } from "./audit-input";

function mockWriter(): AuditWriter & {
  events: Array<{
    requestId: string;
    eventType: string;
    event: AuditEventInput;
  }>;
} {
  const events: Array<{
    requestId: string;
    eventType: string;
    event: AuditEventInput;
  }> = [];

  return {
    events,
    record: vi.fn(
      async (
        requestId: string,
        _tenantId: string,
        _source: string,
        event: AuditEventInput,
      ) => {
        events.push({ requestId, eventType: event.eventType, event });
      },
    ),
  };
}

function testContext(
  overrides: Partial<ExecutionContext> = {},
): ExecutionContext {
  return {
    requestId: "test-req-1",
    tenantId: "test-tenant",
    principal: { sub: "user:alice", principalType: "user" },
    sourceService: "test-service",
    operationName: "test.op",
    ...overrides,
  };
}

describe("executeAuditedOperation", () => {
  it("emits requested + completed on success", async () => {
    const writer = mockWriter();
    const ctx = testContext();

    const result = await executeAuditedOperation(ctx, writer, {
      operationName: "resource.create",
      resource: { type: "resource", id: "proj-1" },
      action: "create",
      execute: async () => ({ id: "proj-1", created: true }),
    });

    expect(result.success).toBe(true);
    expect(result.outcome).toBe("completed");
    expect(result.data).toEqual({ id: "proj-1", created: true });

    expect(writer.events).toHaveLength(2);
    expect(writer.events[0]!.eventType).toBe("resource.create.requested");
    expect(writer.events[1]!.eventType).toBe("resource.create.completed");
    expect(writer.events[1]!.event.decision?.allowed).toBe(true);
  });

  it("emits requested + denied on OperationDeniedError", async () => {
    const writer = mockWriter();
    const ctx = testContext();

    const result = await executeAuditedOperation(ctx, writer, {
      operationName: "resource.delete",
      resource: { type: "resource", id: "proj-1" },
      execute: async () => {
        throw new OperationDeniedError("Not authorized", [
          { code: "role_missing", message: "Admin role required" },
        ]);
      },
    });

    expect(result.success).toBe(false);
    expect(result.outcome).toBe("denied");
    expect(result.reasons).toEqual([
      { code: "role_missing", message: "Admin role required" },
    ]);

    expect(writer.events).toHaveLength(2);
    expect(writer.events[0]!.eventType).toBe("resource.delete.requested");
    expect(writer.events[1]!.eventType).toBe("resource.delete.denied");
    expect(writer.events[1]!.event.decision?.allowed).toBe(false);
  });

  it("emits requested + failed on unexpected error", async () => {
    const writer = mockWriter();
    const ctx = testContext();

    const result = await executeAuditedOperation(ctx, writer, {
      operationName: "resource.update",
      execute: async () => {
        throw new Error("Database connection failed");
      },
    });

    expect(result.success).toBe(false);
    expect(result.outcome).toBe("failed");
    expect(result.error).toBe("Database connection failed");

    expect(writer.events).toHaveLength(2);
    expect(writer.events[0]!.eventType).toBe("resource.update.requested");
    expect(writer.events[1]!.eventType).toBe("resource.update.failed");
  });

  it("preserves requestId across all events", async () => {
    const writer = mockWriter();
    const ctx = testContext({ requestId: "corr-123" });

    await executeAuditedOperation(ctx, writer, {
      operationName: "test.op",
      execute: async () => "ok",
    });

    expect(writer.events.every((e) => e.requestId === "corr-123")).toBe(true);
  });

  it("uses system actor when no principal", async () => {
    const writer = mockWriter();
    const ctx = testContext({ principal: null });

    await executeAuditedOperation(ctx, writer, {
      operationName: "system.task",
      execute: async () => "ok",
    });

    expect(writer.events[0]!.event.actor.sub).toBe("system");
    expect(writer.events[0]!.event.actor.principalType).toBe("service");
  });

  it("failed action still produces audit events", async () => {
    const writer = mockWriter();
    const ctx = testContext();

    const result = await executeAuditedOperation(ctx, writer, {
      operationName: "critical.action",
      execute: async () => {
        throw new TypeError("null reference");
      },
    });

    // The key requirement: even failed actions are audited
    expect(result.success).toBe(false);
    expect(writer.events).toHaveLength(2);
    expect(writer.events[1]!.eventType).toBe("critical.action.failed");
  });
});
