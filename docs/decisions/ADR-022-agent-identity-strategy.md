# ADR-022: Agent Identity Strategy

## Status

Accepted

## Context

AI agents perform actions that affect user data, call external APIs, and interact with internal services. We must decide how agents are identified. This decision directly impacts traceability, revocability, and blast radius when things go wrong.

This ADR extends ADR-007 (Agent Identity Model) with runtime security specifics.

## Decision

**Per-agent-instance identity.** Each deployed agent instance receives its own Auth0 M2M application with unique credentials.

### Why Per-Instance

- **Traceability:** Every action maps to a specific agent instance via `sub`.
- **Revocability:** Disabling one M2M application kills one agent. No collateral damage.
- **Blast radius:** Compromised credentials affect one instance, not all agents or all of a type.

### Credential Management

- Client secrets stored in AWS Secrets Manager at `actbound/<env>/agents/<agent_instance_id>`
- Rotated on the Tier 2 schedule (90 days, via Lambda calling Auth0 Management API)
- Destroyed on agent decommission

### Kill Switch

Disable the Auth0 M2M application to immediately revoke the agent. All new token requests fail instantly. Existing JWTs expire within 1 hour. OpenFGA tuples are purged.

## Consequences

- Full attribution for every agent action.
- Clean revocation path for individual agents.
- More M2M applications to manage (automation required at scale).
- Agent provisioning must create Auth0 app + Secrets Manager entry + OpenFGA tuples atomically.
