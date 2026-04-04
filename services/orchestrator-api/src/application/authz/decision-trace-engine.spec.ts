import { describe, it, expect, vi, beforeEach } from "vitest";
import { DecisionTraceEngine } from "./decision-trace-engine";
import { PolicyEngine } from "./policies/policy-engine";
import type {
  RelationshipWriter,
  RelationshipTuple,
  RelationshipWriteResult,
} from "@actbound/openfga";

function mockWriter(overrides: Partial<RelationshipWriter> = {}) {
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
    readTuples: vi.fn(async (): Promise<RelationshipTuple[]> => []),
    listRelatedSubjects: vi.fn(async (): Promise<string[]> => []),
    ...overrides,
  } as unknown as RelationshipWriter;
}

describe("DecisionTraceEngine", () => {
  let engine: DecisionTraceEngine;
  let writer: ReturnType<typeof mockWriter>;

  beforeEach(() => {
    writer = mockWriter();
    engine = new DecisionTraceEngine(writer, new PolicyEngine());
  });

  it("returns allow when OpenFGA allows direct access", async () => {
    vi.mocked(writer.check).mockResolvedValue(true);

    const trace = await engine.evaluate({
      subjectType: "user",
      subjectId: "alice",
      resourceType: "resource",
      resourceId: "proj-1",
      action: "viewer",
    });

    expect(trace.finalDecision).toBe("allow");
    expect(trace.steps).toHaveLength(3); // rbac, abac, openfga
    expect(trace.steps[2]!.layer).toBe("openfga");
    expect(trace.steps[2]!.result).toBe("allow");
    expect(trace.subject).toEqual({ type: "user", id: "alice" });
    expect(trace.resource).toEqual({ type: "resource", id: "proj-1" });
    expect(trace.requestId).toBeDefined();
    expect(trace.timestamp).toBeDefined();
  });

  it("returns deny when OpenFGA denies and no inherited access", async () => {
    vi.mocked(writer.check).mockResolvedValue(false);
    vi.mocked(writer.readTuples).mockResolvedValue([]);

    const trace = await engine.evaluate({
      subjectType: "user",
      subjectId: "charlie",
      resourceType: "resource",
      resourceId: "proj-1",
      action: "viewer",
    });

    expect(trace.finalDecision).toBe("deny");
    expect(
      trace.steps.some((s) => s.layer === "openfga" && s.result === "deny"),
    ).toBe(true);
  });

  it("maps assistant to agent in OpenFGA calls", async () => {
    vi.mocked(writer.check).mockResolvedValue(true);

    await engine.evaluate({
      subjectType: "assistant",
      subjectId: "bot-1",
      resourceType: "resource",
      resourceId: "proj-1",
      action: "operator",
    });

    expect(vi.mocked(writer.check)).toHaveBeenCalledWith({
      user: "agent:bot-1",
      relation: "operator",
      object: "resource:proj-1",
    });
  });

  it("detects inherited access via org membership", async () => {
    // First check: direct access denied
    vi.mocked(writer.check)
      .mockResolvedValueOnce(false) // direct check fails
      .mockResolvedValueOnce(true) // member of org check
      .mockResolvedValueOnce(true); // inherited check succeeds

    // Resource has org access
    vi.mocked(writer.readTuples).mockResolvedValueOnce([
      {
        user: "organization:acme",
        relation: "viewer",
        object: "resource:proj-1",
      },
    ]);

    const trace = await engine.evaluate({
      subjectType: "user",
      subjectId: "bob",
      resourceType: "resource",
      resourceId: "proj-1",
      action: "viewer",
    });

    expect(trace.finalDecision).toBe("allow");
    const inheritedStep = trace.steps.find((s) => s.metadata?.inheritedVia);
    expect(inheritedStep).toBeDefined();
    expect(inheritedStep!.reason).toContain("Inherited");
    expect(inheritedStep!.reason).toContain("organization:acme");
  });

  it("includes ABAC evaluation step", async () => {
    vi.mocked(writer.check).mockResolvedValue(true);

    const trace = await engine.evaluate({
      subjectType: "user",
      subjectId: "alice",
      resourceType: "resource",
      resourceId: "proj-1",
      action: "viewer",
    });

    const abacStep = trace.steps.find((s) => s.layer === "abac");
    expect(abacStep).toBeDefined();
    // With default policies and viewer action from a user with no special metadata,
    // no policies should trigger
    expect(abacStep!.result).toBe("skip");
    expect(abacStep!.metadata?.policiesEvaluated).toBe(true);
  });

  it("uses provided requestId for correlation", async () => {
    vi.mocked(writer.check).mockResolvedValue(true);

    const trace = await engine.evaluate({
      subjectType: "user",
      subjectId: "alice",
      resourceType: "resource",
      resourceId: "proj-1",
      action: "viewer",
      requestId: "custom-correlation-id",
    });

    expect(trace.requestId).toBe("custom-correlation-id");
  });

  it("generates requestId if not provided", async () => {
    vi.mocked(writer.check).mockResolvedValue(true);

    const trace = await engine.evaluate({
      subjectType: "user",
      subjectId: "alice",
      resourceType: "resource",
      resourceId: "proj-1",
      action: "viewer",
    });

    expect(trace.requestId).toBeTruthy();
    expect(trace.requestId.length).toBeGreaterThan(0);
  });

  it("measures total duration", async () => {
    vi.mocked(writer.check).mockResolvedValue(true);

    const trace = await engine.evaluate({
      subjectType: "user",
      subjectId: "alice",
      resourceType: "resource",
      resourceId: "proj-1",
      action: "viewer",
    });

    expect(trace.totalDurationMs).toBeGreaterThanOrEqual(0);
  });
});
