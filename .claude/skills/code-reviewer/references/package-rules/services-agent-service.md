# Package Rules — services/agent-service

## Role

`services/agent-service` is the internal runtime/backend enforcement service for agent execution.

It must independently re-check authorization and never trust upstream authorization alone.

## Reviewer priorities

1. preserve independent backend enforcement
2. preserve delegated-versus-independent execution boundaries
3. protect tool execution and secret access boundaries
4. maintain attribution, audit, and kill-switch semantics
5. keep agent runtime behavior deterministic and fail-closed

## Flag as blocker

- trusting orchestrator authorization without local re-check where required
- delegated execution without enforcing capability + user consent + user authorization intersection
- shared/global agent credentials or weakened per-instance identity handling
- unsafe tool execution authorization
- secret retrieval that violates Token Vault versus Secrets Manager boundaries
- audit or attribution regression for agent actions
- kill-switch weakening or bypass risk

## Flag as high severity

- missing request/workflow correlation for multi-step execution
- weak runtime error handling that obscures denied versus failed outcomes
- incomplete tests for delegated execution paths
- insufficient validation around tool invocation inputs or outputs
- contract drift with shared SDK or authorization surfaces

## Review for

- clear distinction between delegated and independent execution
- per-instance identity preservation
- explicit authorization re-checks
- bounded tool access control
- correct use of shared permission and OpenFGA abstractions
- strong audit event emission for execution lifecycle
- clear denial and recovery behavior under dependency failures
- no unsafe shortcut around runtime security controls

## Dependency expectations

- may depend on shared packages such as authorization, openfga, sdk, and config
- should not invent alternate policy engines or contract models
- should not expose internal runtime-only concerns into frontend-facing packages

## Testing expectations

Require tests for:

- delegated execution intersection rules
- independent execution paths
- tool authorization checks
- secret access boundaries
- audit/attribution emission
- fail-closed behavior on authz/OpenFGA dependency issues
