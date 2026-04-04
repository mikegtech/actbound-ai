/**
 * Maps normalized lifecycle events to OpenFGA tuple mutations.
 *
 * Pure function — no side effects. Takes an event, returns a tuple operation.
 * This is the core projection logic: what Auth0 events become in OpenFGA.
 */

import type { SyncEvent } from "./events";

export type TupleOperation = {
  action: "write" | "delete";
  user: string;
  relation: string;
  object: string;
};

/**
 * Map a lifecycle event to zero or more tuple operations.
 * Returns an array because some events require multiple tuple changes
 * (e.g., promotion = delete member + write admin).
 */
export function mapEventToTuples(event: SyncEvent): TupleOperation[] {
  const subject = `${event.subjectType}:${event.subjectId}`;
  const object = `${event.objectType}:${event.objectId}`;

  switch (event.eventType) {
    case "user.org.added":
    case "agent.org.assigned":
      return [{ action: "write", user: subject, relation: "member", object }];

    case "user.org.removed":
    case "agent.org.removed":
      // Remove both member and admin relations (idempotent — deleting non-existent is a no-op)
      return [
        { action: "delete", user: subject, relation: "member", object },
        { action: "delete", user: subject, relation: "admin", object },
      ];

    case "user.org.promoted":
      // Add admin, remove explicit member (admin inherits member)
      return [
        { action: "write", user: subject, relation: "admin", object },
        { action: "delete", user: subject, relation: "member", object },
      ];

    case "user.org.demoted":
      // Remove admin, add explicit member
      return [
        { action: "delete", user: subject, relation: "admin", object },
        { action: "write", user: subject, relation: "member", object },
      ];

    case "user.resource.granted":
    case "agent.resource.granted":
      return [
        {
          action: "write",
          user: subject,
          relation: event.relation ?? "viewer",
          object,
        },
      ];

    case "user.resource.revoked":
    case "agent.resource.revoked":
      // Remove all access levels (idempotent)
      return [
        { action: "delete", user: subject, relation: "viewer", object },
        { action: "delete", user: subject, relation: "editor", object },
        { action: "delete", user: subject, relation: "owner", object },
      ];

    case "agent.action.assigned":
      return [{ action: "write", user: subject, relation: "executor", object }];

    case "agent.action.unassigned":
      return [
        { action: "delete", user: subject, relation: "executor", object },
      ];

    case "user.action.delegated":
      return [
        { action: "write", user: subject, relation: "delegator", object },
      ];

    case "user.action.undelegated":
      return [
        { action: "delete", user: subject, relation: "delegator", object },
      ];

    default: {
      const _exhaustive: never = event.eventType;
      throw new Error(`Unknown event type: ${_exhaustive}`);
    }
  }
}
