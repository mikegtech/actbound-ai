# ADR-015: OpenFGA Model Design

## Status

Accepted

## Context

OpenFGA is the fine-grained authorization engine for the platform. We need a type/relation model that supports multi-tenant organizations, project-level access, agent delegation, provider connections, and token brokering without becoming unmanageable.

## Decision

### Core Types

| Type                  | Purpose                                    |
| --------------------- | ------------------------------------------ |
| `organization`        | Tenant boundary, membership container      |
| `project`             | Scoped work container within an org        |
| `agent_action`        | A specific action an agent can execute     |
| `provider_connection` | User's connected external provider account |
| `vault_session`       | Token Vault session for delegated access   |
| `brokered_token`      | Cached/brokered token resource             |

### Key Design Rules

1. **Subjects are typed identifiers.** `user:auth0|alice`, `agent:research_001`, `service:orchestrator`. No PII.
2. **Inheritance flows through `from` clauses.** Org admin inherits project editor. Project editor inherits project viewer.
3. **Agent execution requires dual authorization.** `can_execute` on `agent_action` requires both an `executor` (agent) AND a `delegator` (user). Neither alone is sufficient.
4. **Dynamic context is never a tuple.** Step-up status, request timestamps, and preview mode are ABAC attributes evaluated at runtime.
5. **Tuples represent durable relationships.** "Alice is a member of org acme" is a tuple. "Alice's request has step-up satisfied" is not.

### Model (OpenFGA DSL)

See `docs/architecture/authorization-model.md` section 4.1 for the full DSL.

### Example Tuple Set

```
user:auth0|alice    member    organization:acme
user:auth0|bob      admin     organization:acme
organization:acme   org       project:proj_001
user:auth0|alice    owner     project:proj_001
agent:research_001  executor  agent_action:action_001
user:auth0|alice    delegator agent_action:action_001
```

### Tuple Lifecycle

- Tuples are created by the IdP-to-OpenFGA sync Lambda (for org membership) or by backend services (for resource-level relations like project ownership).
- Tuples are deleted when the relationship ends (user leaves org, agent decommissioned, project deleted).
- Tuples are never updated — they are deleted and re-created.

## Consequences

- Multi-tenant isolation is modeled explicitly via `organization` membership.
- Agent delegation is safe: requires both agent assignment and user consent.
- Inheritance reduces tuple count (org members automatically get project viewer).
- The model is auditable — every relationship is an explicit tuple.
- OpenFGA query cost scales with relationship depth, but the model is shallow (max 2 hops for most checks).
