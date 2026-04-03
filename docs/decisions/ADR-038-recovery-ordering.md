# ADR-038: Recovery Ordering Model

## Status

Accepted

## Context

When recovering from a broad failure, systems must be restored in dependency order. Restoring a service before its identity provider or secrets store leads to cascading failures.

## Decision

### Recovery Order

```
1. Infrastructure (VPC, compute, network)
2. Identity (Auth0 — verify config, re-apply if needed)
3. Secrets (Secrets Manager — verify access, rotate if compromised)
4. Authorization (OpenFGA — deploy model, restore tuples, reconcile)
5. Application (services — deploy from ECR, verify health)
6. Agents (re-provision M2M apps, restore delegation tuples)
```

### Why This Order

- Infrastructure must exist before anything can run.
- Identity must work before services can validate JWTs.
- Secrets must be accessible before services can connect to databases.
- Authorization must be functional before services can make fine-grained decisions.
- Applications depend on all of the above.
- Agents depend on everything plus delegation state.

### Partial Recovery

For single-system failures, skip to the affected step. But always verify upstream dependencies are healthy before restoring a downstream system.

## Consequences

- Clear dependency chain prevents cascading recovery failures.
- Each step has a verification checkpoint before proceeding.
- Partial recovery is possible for isolated failures.
- The ordering is documented and tested in quarterly drills.
