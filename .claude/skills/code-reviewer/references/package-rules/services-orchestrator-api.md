# Package Rules — services/orchestrator-api

## Role

`services/orchestrator-api` is the public, external-facing NestJS service.

It owns gateway-facing API behavior, token broker flows, delegated access orchestration, and authorization-aware entry points.

## Reviewer priorities

1. enforce authorization before sensitive actions
2. preserve fail-closed behavior
3. protect token broker and delegated access boundaries
4. maintain API and DTO contract integrity
5. preserve auditability, attribution, and observability

## Flag as blocker

- public routes introduced without proper authn/authz handling
- token issuance or delegated access paths that bypass required checks
- fail-open logic on auth, authorization, OpenFGA, or dependent security systems
- raw token leakage beyond intended service boundaries
- weakening of tenant, principal, issuer, or consent validation
- breaking the rule that only orchestrator-api is publicly exposed
- unsafe handling of platform secrets versus Token Vault boundaries

## Flag as high severity

- missing structured audit events for security-relevant operations
- request context propagation gaps for requestId, workflowId, principal, or tenant
- weak input validation on externally reachable routes
- missing tests for new routes or behavior changes
- contract drift against SDK/OpenAPI surfaces
- unclear separation between orchestration logic and authorization decision logic

## Review for

- authorization before sensitive brokered or delegated actions
- correct principal normalization and tenant isolation
- safe token broker caching and issuance behavior
- explicit denial paths with reason codes where appropriate
- strong DTO/schema validation at boundaries
- proper use of shared authorization and SDK packages
- observability around broker, consent, delegation, and auth failures
- no hidden trust in frontend claims beyond validated identity context

## Dependency expectations

- may depend on shared packages such as authorization, openfga, sdk, and config
- should not leak NestJS or persistence concerns into shared packages
- should not duplicate shared policy logic unnecessarily

## Testing expectations

Require tests for:

- auth guards and authorization flows
- token broker behavior
- delegated access orchestration
- multi-issuer normalization behavior
- route contract changes
- fail-closed behavior on dependency failure
