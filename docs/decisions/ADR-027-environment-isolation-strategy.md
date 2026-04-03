# ADR-027: Environment Isolation Strategy

## Status

Accepted

## Context

The platform needs dev, staging, and prod environments. We must decide how to isolate them to prevent cross-environment data access, credential leakage, and blast-radius expansion.

Options: multi-account AWS (maximum isolation, highest overhead) vs single-account with VPC-level isolation (simpler, sufficient for small team).

## Decision

**Single AWS account with per-environment VPCs and IAM-scoped access.**

### Isolation Mechanisms

| Boundary      | Mechanism                                                          |
| ------------- | ------------------------------------------------------------------ |
| Network       | Separate VPCs per environment, no VPC peering                      |
| Secrets       | Secrets Manager path prefix (`actbound/{env}/*`) + IAM scoping     |
| Data          | Separate RDS and Redis instances per environment                   |
| Authorization | Separate OpenFGA stores per environment                            |
| Compute       | Separate ECS clusters per environment                              |
| IAM           | Role names include environment (`actbound-orchestrator-prod-role`) |

### Why Not Multi-Account (Yet)

For a small team (1-3 engineers), multi-account adds significant overhead: cross-account IAM, multiple billing setups, Organization SCPs, and SSO configuration. The VPC + IAM isolation model provides sufficient separation at this scale.

### When to Upgrade

Move to multi-account when: team exceeds 5 engineers, compliance requires account-level isolation, or cost allocation requires per-environment billing.

## Consequences

- Clean environment isolation without multi-account complexity.
- A compromise in dev cannot reach prod (no peering, IAM scoping).
- Single account means careful IAM policy management — all environments share the same IAM namespace.
- Environment-aware naming conventions are required everywhere (VPCs, roles, secrets, services).
