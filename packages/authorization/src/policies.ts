import type { ActorRole } from "./types";
import type { Permission } from "./permissions";

export const rolePermissions: Record<ActorRole, Permission[]> = {
  admin: [
    "permissions:read",
    "connections:read",
    "agent_actions:preview",
    "agent_actions:execute",
    "audit_events:read",
    "valuations:execute",
    "listings:read",
  ],
  operator: [
    "permissions:read",
    "connections:read",
    "agent_actions:preview",
    "agent_actions:execute",
    "audit_events:read",
    "valuations:execute",
    "listings:read",
  ],
  viewer: ["permissions:read", "connections:read", "listings:read"],
  service: ["valuations:execute", "listings:read"],
};

export const permissionScopeRequirements: Partial<
  Record<Permission, string[]>
> = {
  "connections:read": ["connections.read"],
  "agent_actions:preview": ["agent.preview"],
  "agent_actions:execute": ["agent.execute"],
  "valuations:execute": ["valuations.execute"],
};
