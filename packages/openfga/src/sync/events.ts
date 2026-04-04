/**
 * Normalized lifecycle events for IdP → OpenFGA tuple sync.
 *
 * These are internal event types, not raw Auth0 webhook payloads.
 * The ingestion layer normalizes Auth0 events into these types.
 */

export type SyncEventType =
  | "user.org.added"
  | "user.org.removed"
  | "user.org.promoted" // member → admin
  | "user.org.demoted" // admin → member
  | "user.resource.granted"
  | "user.resource.revoked"
  | "agent.org.assigned"
  | "agent.org.removed"
  | "agent.resource.granted"
  | "agent.resource.revoked"
  | "agent.action.assigned" // executor assignment
  | "agent.action.unassigned"
  | "user.action.delegated" // user delegates to agent
  | "user.action.undelegated";

export interface SyncEvent {
  eventId: string;
  eventType: SyncEventType;
  subjectType: "user" | "agent";
  subjectId: string;
  objectType: "organization" | "resource" | "agent_action";
  objectId: string;
  relation?: string; // override default relation for the event type
  correlationId?: string;
  timestamp: string;
}
