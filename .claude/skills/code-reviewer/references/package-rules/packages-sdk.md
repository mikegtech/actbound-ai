# Package Rules — packages/sdk

## Role

`packages/sdk` is the shared contract layer: Zod schemas, DTOs, typed clients, and OpenAPI generation.

It is a source-of-truth exchange layer between services and consumers.

## Reviewer priorities

1. preserve contract integrity
2. prevent drift between service behavior and shared schemas
3. preserve strong typing and schema clarity
4. keep the package free of runtime/framework/persistence leakage
5. maintain compatibility for downstream consumers

## Flag as blocker

- introducing NestJS, Drizzle, persistence, or service-local runtime concerns
- breaking contract changes without coordinated downstream updates
- schema changes that weaken validation in security-relevant flows
- generated client/OpenAPI mismatches left unresolved
- unclear ownership of source-of-truth schemas

## Flag as high severity

- undocumented contract changes
- missing test or validation coverage for changed schemas
- naming or shape drift that will confuse service or UI consumers
- duplicate schema definitions outside the SDK
- excessive coupling to one service implementation detail

## Review for

- zero NestJS, zero Drizzle, zero persistence boundary preservation
- strong Zod schema definitions
- DTO and client consistency
- serialization/deserialization clarity
- versioning or migration awareness where needed
- generated artifacts refreshed when required
- no leakage of secrets or internal-only fields into public contracts

## Dependency expectations

- should remain pure TypeScript/Zod/OpenAPI-oriented shared code
- should not import service-local modules
- should not become a dumping ground for miscellaneous utilities

## Testing expectations

Require tests or validation for:

- schema changes
- client generation changes
- OpenAPI generation changes
- compatibility-sensitive DTO changes
