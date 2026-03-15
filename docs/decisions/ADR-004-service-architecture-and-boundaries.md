# ADR 004: Service Architecture and Boundaries

## Status

Accepted

## Context

As ActBound AI scales, we need explicit architecture boundaries to avoid spaghetti code, prevent domain logic from leaking into infrastructure concerns, and keep shared packages pure and reusable. We must clearly define the responsibilities of our two backend services (`orchestrator-api` and `agent-service`), our frontend (`apps/web`), and our shared libraries (`packages/sdk`, `packages/authorization`).

## Decision

We will enforce the following architectural patterns and boundaries across the repository:

1. **NestJS Services use Hexagonal Architecture (Ports and Adapters)**:
   - This applies to `services/orchestrator-api` and `services/agent-service`.
   - Each service must have explicit `domain`, `application`, `infrastructure`, and `presentation` layers.

2. **`packages/sdk` strict purity**:
   - The SDK is framework-agnostic.
   - It **MUST HAVE**:
     - Zero NestJS imports.
     - Zero Drizzle imports.
     - Zero persistence concerns.
   - It owns shared Zod schemas, TypeScript DTOs, route contracts, typed clients, and the OpenAPI document generation process.

3. **`packages/authorization` framework integration**:
   - The authorization package remains framework-agnostic, with the exception of the small NestJS integration seams that are already needed and established.

4. **`apps/web` constraints**:
   - The frontend remains a React-only application.
   - It consumes backend contracts from `packages/sdk` and does not import or execute any backend framework code or configurations.

5. **Backend Enforcement Source of Truth**:
   - The backend enforcement layer remains the absolute source of truth for authorization and business rules. The UI only consumes permission decisions, it does not evaluate raw policies.

## Consequences

- **Improved Testability**: We can test domain and application logic without spinning up database connections or HTTP servers.
- **Strict SDK Usability**: Because `packages/sdk` contains zero framework or ORM dependencies, it can be safely imported by any Node.js process, React app, or edge function without bloating bundles or crashing.
- **Future-Proofing**: If we need to swap out a database, a framework, or an external API provider, we only need to touch the infrastructure layer of the affected services.
