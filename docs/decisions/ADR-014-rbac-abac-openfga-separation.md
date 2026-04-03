# ADR-014: RBAC vs ABAC vs OpenFGA Separation

## Status

Accepted

## Context

The platform needs authorization at three granularities: coarse feature gating, contextual attribute checks, and fine-grained resource-level access. Mixing these into a single system creates complexity and makes the authorization model hard to reason about.

We need a clear rule for which system handles which type of check, with no overlap.

## Decision

### Three layers, strict boundaries

| Layer   | Scope                           | Storage                 | Queried via                    |
| ------- | ------------------------------- | ----------------------- | ------------------------------ |
| RBAC    | Feature-area gating             | Auth0 JWT claims        | JWT parsing (no external call) |
| ABAC    | Contextual attribute evaluation | Runtime (not persisted) | Request context assembly       |
| OpenFGA | Resource-level relationships    | OpenFGA tuple store     | OpenFGA Check API              |

### Assignment Rule

Every permission check maps to exactly one primary layer:

- **RBAC** if the check only depends on the actor's role (e.g., "admins can access admin endpoints")
- **ABAC** if the check depends on request context, environment, or ephemeral attributes (e.g., "step-up is required", "tenant IDs must match")
- **OpenFGA** if the check depends on a relationship between a principal and a specific resource (e.g., "user alice is editor of project X")

A single request may traverse all three layers sequentially, but each individual check belongs to exactly one.

### What Each Layer Must NOT Do

| Layer   | Forbidden                                                                        |
| ------- | -------------------------------------------------------------------------------- |
| RBAC    | Resource-level checks, per-resource ownership, org membership queries            |
| ABAC    | Persisting decisions, replacing OpenFGA for relationship checks                  |
| OpenFGA | Storing identity data, storing dynamic context, replacing RBAC for coarse gating |

### Role Count Constraint

The platform maintains at most 5 system roles. If a new access pattern cannot be modeled with existing roles, it must use OpenFGA relations, not a new role.

## Consequences

- Clear mental model: developers always know which system to use for a given check.
- RBAC runs from JWT claims with zero latency — fast short-circuit.
- ABAC evaluations are stateless and testable without external dependencies.
- OpenFGA handles the complex relational cases where RBAC and ABAC are insufficient.
- Three systems to understand, but each is simple within its scope.
