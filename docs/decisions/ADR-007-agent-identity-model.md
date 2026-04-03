# ADR-007: Agent Identity Model

## Status

Accepted

## Context

AI agents in the ActBound platform perform actions that may affect user data, call external APIs on behalf of users, and interact with internal services. We need to decide how agents are identified, authenticated, and attributed.

The key tension is between operational simplicity (fewer identities to manage) and security/auditability (granular identity per agent).

Options considered:

1. **Shared service identity** — all agents use a single M2M app. Simple but no traceability, revocation is all-or-nothing.
2. **Per-agent-type identity** — one M2M app per agent type (research, execution, etc.). Medium traceability, revocation affects all instances of a type.
3. **Per-agent-instance identity** — one M2M app per deployed agent instance. Full traceability, surgical revocation.

## Decision

**Per-agent-instance identity.** Each agent instance receives its own Auth0 M2M application.

### Authentication

Agents authenticate via Auth0 Client Credentials Grant using their instance-specific client ID and secret. The client secret is stored in AWS Secrets Manager with rotation.

### Token Claims

Agent M2M tokens include:

- `sub`: `<agent_client_id>@clients` (unique per instance)
- `https://actbound.ai/principal_type`: `"agent"`
- `https://actbound.ai/agent_type`: classification (e.g., `"research"`, `"execution"`)
- `https://actbound.ai/agent_instance_id`: unique instance identifier
- `https://actbound.ai/on_behalf_of`: delegating user's `sub` (present only when acting delegated)
- `https://actbound.ai/tenant_id`: tenant boundary

### Attribution

Every agent action is traceable via three dimensions:

- **Who**: `sub` (the specific agent instance)
- **What kind**: `agent_type` (the agent classification)
- **On whose behalf**: `on_behalf_of` (the delegating user, if any)

### Delegation Model

When an agent acts on behalf of a user:

1. The agent's `sub` remains the actor in all logs and audit records
2. The `on_behalf_of` claim links the action to the delegating user
3. Authorization is evaluated as an intersection: the agent must have permission AND the user must have consented to the scope
4. The agent never receives the user's JWT — it uses its own credentials plus the delegation context

### Lifecycle

1. Agent provisioned → Auth0 M2M app created, client secret stored in AWS Secrets Manager
2. Agent operates → authenticates with own credentials, acts within scoped permissions
3. Agent decommissioned → Auth0 M2M app disabled/deleted, Secrets Manager entry removed

## Consequences

- Full auditability: every action attributable to a specific agent instance and optional delegating user.
- Surgical revocation: disable one agent without affecting others.
- More Auth0 M2M applications to manage (automation required at scale).
- Client secrets must be provisioned and rotated via AWS Secrets Manager.
- OpenFGA authorization model must support `agent:<instance_id>` as a principal type.
