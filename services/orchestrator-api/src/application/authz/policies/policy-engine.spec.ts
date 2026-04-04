import { describe, it, expect, beforeEach } from "vitest";
import { PolicyEngine } from "./policy-engine";
import { evaluateCondition } from "./condition-evaluator";

describe("condition evaluator", () => {
  it("eq matches equal values", () => {
    expect(
      evaluateCondition(
        { field: "action", operator: "eq", value: "editor" },
        { action: "editor" },
      ),
    ).toBe(true);
  });

  it("eq rejects unequal values", () => {
    expect(
      evaluateCondition(
        { field: "action", operator: "eq", value: "editor" },
        { action: "viewer" },
      ),
    ).toBe(false);
  });

  it("neq matches unequal values", () => {
    expect(
      evaluateCondition(
        { field: "action", operator: "neq", value: "viewer" },
        { action: "editor" },
      ),
    ).toBe(true);
  });

  it("gt compares numbers", () => {
    expect(
      evaluateCondition(
        { field: "amount", operator: "gt", value: 1000 },
        { amount: 1500 },
      ),
    ).toBe(true);
    expect(
      evaluateCondition(
        { field: "amount", operator: "gt", value: 1000 },
        { amount: 500 },
      ),
    ).toBe(false);
  });

  it("lt compares numbers", () => {
    expect(
      evaluateCondition(
        { field: "hour", operator: "lt", value: 8 },
        { hour: 5 },
      ),
    ).toBe(true);
  });

  it("in checks array membership", () => {
    expect(
      evaluateCondition(
        { field: "ip", operator: "in", value: ["10.0.0.1", "127.0.0.1"] },
        { ip: "127.0.0.1" },
      ),
    ).toBe(true);
  });

  it("not_in checks array non-membership", () => {
    expect(
      evaluateCondition(
        { field: "ip", operator: "not_in", value: ["10.0.0.1", "127.0.0.1"] },
        { ip: "203.0.113.5" },
      ),
    ).toBe(true);
  });

  it("resolves dot-notation fields", () => {
    expect(
      evaluateCondition(
        { field: "metadata.ip", operator: "eq", value: "10.0.0.1" },
        { metadata: { ip: "10.0.0.1" } },
      ),
    ).toBe(true);
  });
});

describe("PolicyEngine", () => {
  let engine: PolicyEngine;

  beforeEach(() => {
    engine = new PolicyEngine();
  });

  it("seeds default policies", () => {
    const policies = engine.listPolicies();
    expect(policies.length).toBeGreaterThanOrEqual(3);
  });

  it("returns none when no policies match", () => {
    const result = engine.evaluate({
      subject: { type: "user", id: "alice" },
      resource: { type: "resource", id: "proj-1" },
      action: "viewer",
      metadata: { ip: "127.0.0.1" },
    });

    // viewer with local IP should not trigger deny or mfa
    expect(result.effect).toBe("none");
  });

  it("deny overrides allow", () => {
    // Create an explicit allow and deny policy
    engine.createPolicy({
      name: "Allow all viewers",
      description: "test",
      active: true,
      target: {},
      conditions: [{ field: "action", operator: "eq", value: "viewer" }],
      effect: "allow",
      priority: 10,
    });

    engine.createPolicy({
      name: "Block suspicious",
      description: "test",
      active: true,
      target: {},
      conditions: [
        { field: "action", operator: "eq", value: "viewer" },
        { field: "suspicious", operator: "eq", value: true },
      ],
      effect: "deny",
      priority: 50,
    });

    const result = engine.evaluate({
      subject: { type: "user", id: "alice" },
      resource: { type: "resource", id: "proj-1" },
      action: "viewer",
      metadata: { suspicious: true },
    });

    expect(result.effect).toBe("deny");
  });

  it("require_mfa blocks when mfa not verified", () => {
    const result = engine.evaluate({
      subject: { type: "assistant", id: "bot-1" },
      resource: { type: "resource", id: "proj-1" },
      action: "operator",
      metadata: { mfaVerified: false },
    });

    // Strict Assistant Access policy should trigger require_mfa
    expect(result.effect).toBe("require_mfa");
    expect(result.triggered.length).toBeGreaterThan(0);
  });

  it("require_mfa passes when mfa verified", () => {
    const result = engine.evaluate({
      subject: { type: "assistant", id: "bot-1" },
      resource: { type: "resource", id: "proj-1" },
      action: "operator",
      metadata: { mfaVerified: true },
    });

    // When mfa is verified, the condition (mfaVerified neq true) is false
    // so the policy should NOT trigger
    expect(result.effect).toBe("none");
  });

  it("high value transfer triggers require_mfa", () => {
    const result = engine.evaluate({
      subject: { type: "user", id: "alice" },
      resource: { type: "resource", id: "proj-1" },
      action: "editor",
      metadata: { amount: 5000, mfaVerified: false, ip: "127.0.0.1" },
    });

    expect(result.effect).toBe("require_mfa");
    expect(
      result.triggered.some((t) => t.policyName === "High Value Transfers"),
    ).toBe(true);
  });

  it("CRUD: create, update, delete policy", () => {
    const created = engine.createPolicy({
      name: "Test Policy",
      description: "test",
      active: true,
      target: {},
      conditions: [{ field: "test", operator: "eq", value: true }],
      effect: "deny",
      priority: 1,
    });

    expect(created.id).toBeDefined();

    const updated = engine.updatePolicy(created.id, { name: "Updated Policy" });
    expect(updated?.name).toBe("Updated Policy");

    const deleted = engine.deletePolicy(created.id);
    expect(deleted).toBe(true);
    expect(engine.getPolicy(created.id)).toBeUndefined();
  });

  it("inactive policies are not evaluated", () => {
    engine.createPolicy({
      name: "Inactive deny",
      description: "test",
      active: false,
      target: {},
      conditions: [{ field: "action", operator: "eq", value: "viewer" }],
      effect: "deny",
      priority: 999,
    });

    const result = engine.evaluate({
      subject: { type: "user", id: "alice" },
      resource: { type: "resource", id: "proj-1" },
      action: "viewer",
      metadata: {},
    });

    // The inactive deny should not have triggered
    expect(result.effect).not.toBe("deny");
  });
});
