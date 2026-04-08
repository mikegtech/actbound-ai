# Package Rules — services/sync-service

## Role

`services/sync-service` is the background sync worker for queue processing, projections, reconciliation, and dead-letter handling.

It is responsible for projecting trusted upstream events into application state and OpenFGA relationship state.

## Reviewer priorities

1. preserve correctness of projection and reconciliation logic
2. prevent identity/profile data from leaking into relationship sync incorrectly
3. preserve idempotency and replay safety
4. maintain DLQ, drift detection, and observability behavior
5. protect tenant and issuer normalization boundaries

## Flag as blocker

- sync logic writing data outside approved projection scope
- syncing identity profiles, roles, or PII into OpenFGA when only relationships should sync
- non-idempotent projection logic likely to corrupt state on replay
- deletion/revocation handling that can silently widen access
- drift reconciliation that can apply unsafe or ambiguous corrections
- fail-open handling of critical projection or authorization state

## Flag as high severity

- weak event validation
- missing DLQ or retry-safe behavior for important handlers
- incomplete observability for projection failures
- mismatch between event schema and projection handler behavior
- missing tests for revocation, invitation, membership, or delegation changes

## Review for

- projection handlers are explicit and scoped
- relationship sync is separated from identity/profile concerns
- replay and duplicate event handling is safe
- tenant and issuer context are preserved correctly
- drift reports are accurate and actionable
- queue and worker behavior do not hide failures
- shared OpenFGA and SDK contracts are used consistently

## Dependency expectations

- may depend on shared packages such as openfga, sdk, authorization, and config
- should not become a general-purpose business logic service
- should keep queue/integration concerns separate from reusable shared package boundaries

## Testing expectations

Require tests for:

- each projection handler
- revocation/removal paths
- idempotent replay behavior
- reconciliation drift detection
- DLQ or failure routing behavior
