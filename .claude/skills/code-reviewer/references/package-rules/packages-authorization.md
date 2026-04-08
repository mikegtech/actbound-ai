# Package Rules — packages/authorization

## Role

`packages/authorization` is the centralized permission and policy engine.

It is the core source of structured authorization decisions and reason codes across the platform.

## Reviewer priorities

1. preserve policy integrity
2. prevent accidental permission widening
3. preserve RBAC, ABAC, and OpenFGA separation
4. maintain deterministic decision behavior and reason reporting
5. keep the package reusable and appropriately decoupled

## Flag as blocker

- permission widening without explicit intent and clear review justification
- overlap or collapse between RBAC, ABAC, and OpenFGA responsibilities
- fail-open authorization behavior
- removal or weakening of denial reasoning for security-relevant paths
- logic that allows frontend or service shortcuts around centralized policy
- introducing framework or persistence coupling that violates package role

## Flag as high severity

- ambiguous decision outputs
- inconsistent reason code behavior
- insufficient tests for changed permission logic
- weak handling of tenant, issuer, resource, or principal context
- duplicated policy logic in consuming services instead of shared abstractions

## Review for

- exact permission semantics
- one-layer-per-permission discipline
- consistent decision structure
- explicit denial and failure behavior
- compatibility with service consumers and UI expectations
- no leakage of NestJS, Drizzle, or service-local concerns into the package
- no unsupported assumptions about single-issuer identity

## Dependency expectations

- should remain reusable and framework-light
- must not import NestJS, service-local infrastructure, or persistence details unless explicitly intended and documented
- should collaborate with OpenFGA boundaries without absorbing them entirely

## Testing expectations

Require tests for:

- permission additions or removals
- reason code changes
- tenant/issuer-aware logic changes
- ABAC context evaluation changes
- fail-closed paths
