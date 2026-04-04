import { describe, it, expect } from "vitest";
import { mapEventToTuples } from "../src/sync/mapper";
import type { SyncEvent } from "../src/sync/events";

function makeEvent(
  overrides: Partial<SyncEvent> & Pick<SyncEvent, "eventType">,
): SyncEvent {
  return {
    eventId: "evt_test_001",
    subjectType: "user",
    subjectId: "alice",
    objectType: "organization",
    objectId: "acme",
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

describe("mapEventToTuples", () => {
  // ── Org membership ──────────────────────────────────────

  describe("user.org.added", () => {
    it("writes a member tuple", () => {
      const ops = mapEventToTuples(makeEvent({ eventType: "user.org.added" }));
      expect(ops).toEqual([
        {
          action: "write",
          user: "user:alice",
          relation: "member",
          object: "organization:acme",
        },
      ]);
    });
  });

  describe("user.org.removed", () => {
    it("deletes both member and admin tuples", () => {
      const ops = mapEventToTuples(
        makeEvent({ eventType: "user.org.removed" }),
      );
      expect(ops).toHaveLength(2);
      expect(ops[0]).toEqual({
        action: "delete",
        user: "user:alice",
        relation: "member",
        object: "organization:acme",
      });
      expect(ops[1]).toEqual({
        action: "delete",
        user: "user:alice",
        relation: "admin",
        object: "organization:acme",
      });
    });
  });

  describe("user.org.promoted", () => {
    it("writes admin and deletes member", () => {
      const ops = mapEventToTuples(
        makeEvent({ eventType: "user.org.promoted" }),
      );
      expect(ops).toEqual([
        {
          action: "write",
          user: "user:alice",
          relation: "admin",
          object: "organization:acme",
        },
        {
          action: "delete",
          user: "user:alice",
          relation: "member",
          object: "organization:acme",
        },
      ]);
    });
  });

  describe("user.org.demoted", () => {
    it("deletes admin and writes member", () => {
      const ops = mapEventToTuples(
        makeEvent({ eventType: "user.org.demoted" }),
      );
      expect(ops).toEqual([
        {
          action: "delete",
          user: "user:alice",
          relation: "admin",
          object: "organization:acme",
        },
        {
          action: "write",
          user: "user:alice",
          relation: "member",
          object: "organization:acme",
        },
      ]);
    });
  });

  // ── Resource access ─────────────────────────────────────

  describe("user.resource.granted", () => {
    it("writes viewer by default", () => {
      const ops = mapEventToTuples(
        makeEvent({
          eventType: "user.resource.granted",
          objectType: "resource",
          objectId: "project-alpha",
        }),
      );
      expect(ops).toEqual([
        {
          action: "write",
          user: "user:alice",
          relation: "viewer",
          object: "resource:project-alpha",
        },
      ]);
    });

    it("writes the specified relation when provided", () => {
      const ops = mapEventToTuples(
        makeEvent({
          eventType: "user.resource.granted",
          objectType: "resource",
          objectId: "project-alpha",
          relation: "editor",
        }),
      );
      expect(ops).toEqual([
        {
          action: "write",
          user: "user:alice",
          relation: "editor",
          object: "resource:project-alpha",
        },
      ]);
    });
  });

  describe("user.resource.revoked", () => {
    it("deletes all access levels", () => {
      const ops = mapEventToTuples(
        makeEvent({
          eventType: "user.resource.revoked",
          objectType: "resource",
          objectId: "project-alpha",
        }),
      );
      expect(ops).toHaveLength(3);
      expect(ops.map((o) => o.relation)).toEqual(["viewer", "editor", "owner"]);
      expect(ops.every((o) => o.action === "delete")).toBe(true);
    });
  });

  // ── Agent org membership ────────────────────────────────

  describe("agent.org.assigned", () => {
    it("writes a member tuple for the agent", () => {
      const ops = mapEventToTuples(
        makeEvent({
          eventType: "agent.org.assigned",
          subjectType: "agent",
          subjectId: "research-001",
        }),
      );
      expect(ops).toEqual([
        {
          action: "write",
          user: "agent:research-001",
          relation: "member",
          object: "organization:acme",
        },
      ]);
    });
  });

  describe("agent.org.removed", () => {
    it("deletes both member and admin tuples for the agent", () => {
      const ops = mapEventToTuples(
        makeEvent({
          eventType: "agent.org.removed",
          subjectType: "agent",
          subjectId: "research-001",
        }),
      );
      expect(ops).toHaveLength(2);
      expect(ops[0]!.user).toBe("agent:research-001");
    });
  });

  // ── Agent action delegation ─────────────────────────────

  describe("agent.action.assigned", () => {
    it("writes executor tuple", () => {
      const ops = mapEventToTuples(
        makeEvent({
          eventType: "agent.action.assigned",
          subjectType: "agent",
          subjectId: "research-001",
          objectType: "agent_action",
          objectId: "valuation-reconcile",
        }),
      );
      expect(ops).toEqual([
        {
          action: "write",
          user: "agent:research-001",
          relation: "executor",
          object: "agent_action:valuation-reconcile",
        },
      ]);
    });
  });

  describe("user.action.delegated", () => {
    it("writes delegator tuple", () => {
      const ops = mapEventToTuples(
        makeEvent({
          eventType: "user.action.delegated",
          objectType: "agent_action",
          objectId: "valuation-reconcile",
        }),
      );
      expect(ops).toEqual([
        {
          action: "write",
          user: "user:alice",
          relation: "delegator",
          object: "agent_action:valuation-reconcile",
        },
      ]);
    });
  });

  describe("user.action.undelegated", () => {
    it("deletes delegator tuple", () => {
      const ops = mapEventToTuples(
        makeEvent({
          eventType: "user.action.undelegated",
          objectType: "agent_action",
          objectId: "valuation-reconcile",
        }),
      );
      expect(ops).toEqual([
        {
          action: "delete",
          user: "user:alice",
          relation: "delegator",
          object: "agent_action:valuation-reconcile",
        },
      ]);
    });
  });
});
