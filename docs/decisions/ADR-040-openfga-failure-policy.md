# ADR-040: OpenFGA Failure Policy

## Status

Accepted

## Context

OpenFGA handles fine-grained relationship-based authorization. When it is unavailable, the platform must decide: fail-open (allow requests without relationship checks) or fail-closed (deny all resource-level requests).

## Decision

**Fail closed.** Extends ADR-021 (Fail-Closed Authorization Policy) with OpenFGA-specific details.

### When OpenFGA Is Unavailable

- RBAC checks (from JWT claims) continue to work — no OpenFGA dependency.
- ABAC checks (from request context) continue to work — no OpenFGA dependency.
- OpenFGA checks return 503 — the request is denied.
- No cached OpenFGA results are used as fallback.

### Why Not Cache OpenFGA Results

Stale authorization is worse than denial:

- A user removed from an org would still have access from cached tuples.
- A revoked agent delegation would still be honored.
- The security guarantee of OpenFGA is that it reflects current relationships — caching undermines this.

### Recovery

1. Restart OpenFGA ECS task if process issue.
2. Verify network (security groups, DNS) if connectivity issue.
3. Restore tuples from daily S3 export if data corruption.
4. Run reconciliation Lambda after restoration.

### Blast Radius Mitigation

Many requests short-circuit at RBAC or ABAC before reaching OpenFGA. Feature-area and admin endpoints that only need RBAC + tenant checks are unaffected by an OpenFGA outage. Only resource-level operations that require relationship checks are impacted.

## Consequences

- No unauthorized access during OpenFGA outage.
- Resource-level operations return 503 during outage.
- RBAC-only operations continue normally.
- Users experience degraded functionality, not security bypass.
