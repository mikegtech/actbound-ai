# Package Rules — packages/openfga

## Role

`packages/openfga` owns the OpenFGA model, relationship writing, tuple sync support, and related abstractions.

It is responsible for resource-level relationship handling, not broad identity or policy ownership.

## Reviewer priorities

1. preserve model correctness
2. prevent unsafe tuple writes or deletes
3. maintain strict separation from identity profile and role concerns
4. preserve reconciliation and sync correctness
5. keep subject/resource normalization stable

## Flag as blocker

- model changes that widen access unintentionally
- tuple operations without clear subject/resource normalization
- use of raw external identity claims as durable OpenFGA subject IDs where internal IDs are required
- syncing roles or profile data into OpenFGA instead of relationships
- fail-open behavior on OpenFGA dependency failure where denial is required

## Flag as high severity

- incomplete model migration/update handling
- missing tests for tuple write/delete semantics
- weak safeguards around reconciliation and backfill paths
- ambiguity between authorization engine responsibilities and relationship-store responsibilities
- poor observability for tuple sync failures or drift

## Review for

- model changes are explicit and justified
- tuple operations preserve tenant boundaries
- internal subject binding is used consistently
- relationship types remain scoped and comprehensible
- sync/reconciliation helpers are safe under retries and partial failures
- consumers of this package are not bypassing approved abstractions

## Dependency expectations

- should stay focused on relationship modeling and tuple operations
- should not absorb full authorization-engine behavior
- should not depend on frontend or unrelated runtime concerns

## Testing expectations

Require tests for:

- model changes
- tuple write/delete behavior
- reconciliation logic
- normalization behavior
- failure handling paths
