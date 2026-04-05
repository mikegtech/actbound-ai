import { describe, it, expect } from "vitest";
import { buildExplainResult } from "./graph-builder";
import type { DecisionTrace } from "./trace-types";

function makeTrace(overrides: Partial<DecisionTrace> = {}): DecisionTrace {
  return {
    requestId: "test-req-1",
    subject: { type: "user", id: "alice" },
    resource: { type: "resource", id: "proj-1" },
    action: "viewer",
    steps: [],
    finalDecision: "allow",
    timestamp: new Date().toISOString(),
    totalDurationMs: 5,
    ...overrides,
  };
}

describe("buildExplainResult", () => {
  it("builds graph for direct access", () => {
    const trace = makeTrace({
      steps: [
        {
          layer: "rbac",
          result: "allow",
          reason: "RBAC allows",
          durationMs: 0,
        },
        { layer: "abac", result: "skip", reason: "No policy", durationMs: 0 },
        {
          layer: "openfga",
          result: "allow",
          reason: "Direct access",
          durationMs: 5,
          metadata: {
            user: "user:alice",
            relation: "viewer",
            object: "resource:proj-1",
            directCheck: true,
          },
        },
      ],
    });

    const result = buildExplainResult(trace);

    // Graph: subject → resource → decision
    expect(result.graph.nodes).toHaveLength(3);
    expect(result.graph.nodes.map((n) => n.type)).toContain("user");
    expect(result.graph.nodes.map((n) => n.type)).toContain("resource");
    expect(result.graph.nodes.map((n) => n.type)).toContain("decision");

    // Direct edge from user to resource
    expect(
      result.graph.edges.some(
        (e) => e.from === "user:alice" && e.to === "resource:proj-1",
      ),
    ).toBe(true);

    // Path
    expect(result.path.length).toBeGreaterThanOrEqual(3);
    expect(result.path[0]!.icon).toBe("identity");
    expect(result.path[result.path.length - 1]!.icon).toBe("result");
    expect(result.path[result.path.length - 1]!.title).toBe("Access Granted");

    // Summary
    expect(result.summary).toContain("direct");
  });

  it("builds graph for inherited access via org", () => {
    const trace = makeTrace({
      steps: [
        {
          layer: "rbac",
          result: "allow",
          reason: "RBAC allows",
          durationMs: 0,
        },
        { layer: "abac", result: "skip", reason: "No policy", durationMs: 0 },
        {
          layer: "openfga",
          result: "deny",
          reason: "No direct access",
          durationMs: 3,
          metadata: { directCheck: true },
        },
        {
          layer: "openfga",
          result: "allow",
          reason: "Inherited via org",
          durationMs: 8,
          metadata: {
            inheritedVia: "organization:acme",
            orgRelation: "viewer",
            userOrgRelation: "member",
          },
        },
      ],
    });

    const result = buildExplainResult(trace);

    // Graph: subject → org → resource → decision
    expect(result.graph.nodes).toHaveLength(4);
    expect(result.graph.nodes.map((n) => n.type)).toContain("organization");

    // Edges: user → org, org → resource
    expect(
      result.graph.edges.some(
        (e) => e.from === "user:alice" && e.to === "organization:acme",
      ),
    ).toBe(true);
    expect(
      result.graph.edges.some(
        (e) => e.from === "organization:acme" && e.to === "resource:proj-1",
      ),
    ).toBe(true);

    // Path includes membership and inherited permission
    expect(result.path.some((s) => s.icon === "membership")).toBe(true);
    expect(result.path.some((s) => s.subtitle === "INHERITED PERMISSION")).toBe(
      true,
    );

    // Summary mentions inherited
    expect(result.summary).toContain("Inherited");
    expect(result.summary).toContain("acme");
  });

  it("builds graph for deny decision", () => {
    const trace = makeTrace({
      finalDecision: "deny",
      steps: [
        {
          layer: "rbac",
          result: "allow",
          reason: "RBAC allows",
          durationMs: 0,
        },
        { layer: "abac", result: "skip", reason: "No policy", durationMs: 0 },
        {
          layer: "openfga",
          result: "deny",
          reason: "No relationship found",
          durationMs: 5,
          metadata: { directCheck: true },
        },
      ],
    });

    const result = buildExplainResult(trace);

    expect(result.graph.nodes.find((n) => n.type === "decision")?.label).toBe(
      "Access Denied",
    );
    expect(result.path[result.path.length - 1]!.title).toBe("Access Denied");
    expect(result.summary).toContain("No relationship found");
  });

  it("builds graph for assistant access", () => {
    const trace = makeTrace({
      subject: { type: "assistant", id: "bot-1" },
      action: "operator",
      steps: [
        {
          layer: "rbac",
          result: "allow",
          reason: "RBAC allows",
          durationMs: 0,
        },
        { layer: "abac", result: "skip", reason: "No policy", durationMs: 0 },
        {
          layer: "openfga",
          result: "allow",
          reason: "Direct operator access",
          durationMs: 4,
          metadata: {
            user: "agent:bot-1",
            relation: "operator",
            object: "resource:proj-1",
            directCheck: true,
          },
        },
      ],
    });

    const result = buildExplainResult(trace);

    expect(result.graph.nodes[0]!.type).toBe("assistant");
    expect(result.graph.nodes[0]!.label).toBe("bot-1");
    expect(result.graph.edges[0]!.relation).toBe("operator");
  });

  it("includes ABAC policy step in path when triggered", () => {
    const trace = makeTrace({
      finalDecision: "require_mfa",
      steps: [
        {
          layer: "rbac",
          result: "allow",
          reason: "RBAC allows",
          durationMs: 0,
        },
        {
          layer: "abac",
          result: "require_mfa",
          reason: "Policy: High Value Transfers",
          durationMs: 1,
          metadata: { policyName: "High Value Transfers" },
        },
      ],
    });

    const result = buildExplainResult(trace);

    expect(result.path.some((s) => s.icon === "policy")).toBe(true);
    expect(result.path.find((s) => s.icon === "policy")?.title).toContain(
      "High Value Transfers",
    );
    expect(result.path[result.path.length - 1]!.title).toBe("MFA Required");
  });

  it("returns stable trace summary", () => {
    const trace = makeTrace({
      steps: [
        { layer: "rbac", result: "allow", reason: "ok", durationMs: 0 },
        { layer: "abac", result: "skip", reason: "skip", durationMs: 0 },
        {
          layer: "openfga",
          result: "allow",
          reason: "ok",
          durationMs: 0,
          metadata: { directCheck: true },
        },
      ],
    });

    const result = buildExplainResult(trace);

    expect(result.trace.requestId).toBe("test-req-1");
    expect(result.trace.action).toBe("viewer");
    expect(result.trace.finalDecision).toBe("allow");
    expect(result.trace.steps).toHaveLength(3);
  });
});
