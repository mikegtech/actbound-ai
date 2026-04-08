# Cross-Cutting Rules — API Contracts

## Purpose

Use this file whenever a change affects request/response DTOs, Zod schemas, typed clients, OpenAPI generation, serialization, deserialization, or any service-to-consumer contract.

`packages/sdk` is the shared contract layer and must remain the source-of-truth exchange layer.

## Reviewer priorities

1. preserve contract integrity across the monorepo
2. prevent drift between services and shared SDK artifacts
3. preserve strong validation on security-sensitive fields
4. maintain backward-awareness where practical
5. keep public and internal contract ownership clear

## Flag as blocker

- breaking contract changes without coordinated consumer updates
- introducing service-local or NestJS/persistence concerns into `packages/sdk`
- leaking internal-only fields, secrets, or unsafe metadata into contracts
- weakening validation on identity, tenant, permission, or token-related fields
- changing public API behavior without corresponding schema/client updates where required

## Flag as high severity

- undocumented shape changes
- duplicate schema definitions outside the shared contract layer
- missing OpenAPI or typed-client refresh after contract changes
- inconsistent naming or field semantics across services and consumers
- serialization mismatches that will cause silent runtime bugs

## Review for

- `packages/sdk` remains pure shared contract code
- DTOs and Zod schemas align with actual service behavior
- typed clients remain synchronized with routes and payloads
- field names and semantics remain clear and stable
- error responses and denial structures are consistent where relevant
- internal service implementation details do not leak into shared contracts
- contract changes include docs/tests/generated artifact updates when needed

## Additional scrutiny

Be especially strict when contract changes affect:

- auth claims
- principal identity fields
- tenant boundaries
- permission decisions
- audit and observability payloads
- delegated access or provider connection data
