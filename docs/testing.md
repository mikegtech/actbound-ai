# Testing Strategy and Baseline

This document outlines the testing approach, required tools, and current baseline thresholds for the ActBound AI monorepo.

## Testing Stack

- **Runner**: [Vitest](https://vitest.dev/)
- **Coverage**: `@vitest/coverage-v8`
- **Configuration**: Shared configuration is located at `vitest.shared.ts` and extended by `vitest.config.ts` in each package. A global `vitest.workspace.ts` enables discovery from the root.

## Running Tests

From the monorepo root:

- **Run all tests**: `pnpm test`
- **Run tests in watch mode**: `pnpm test:watch`
- **Run tests and generate coverage**: `pnpm test:coverage`

Coverage reports are generated in the `coverage/` directory and uploaded automatically via GitHub Actions as a `coverage-report` artifact. Generated formats include:

- `text` (CLI output)
- `lcov`
- `json-summary`
- `html`
- `junit`

## Coverage Policy and Thresholds

As an early-stage repository, coverage bounds are kept practical but enforced. Current minimum thresholds across the workspace are:

- **Lines**: 10%
- **Branches**: 5%
- **Functions**: 10%
- **Statements**: 10%

When creating PRs, the CI pipeline runs `pnpm test:coverage` and will fail if the global coverage drops below these thresholds.

## Required Test Areas

The following parts of the architecture must prioritize testing:

1. **Authorization Engine**: (`packages/authorization`)
   - Policy evaluations, complex permissions, and constraint models must be tested thoroughly. Given this is the sole gatekeeper for enforcement, missing coverage here is a high risk.
2. **SDK Contracts**: (`packages/sdk/src/schemas`)
   - Non-trivial Zod transformations, refinements, and custom validations should have unit tests to ensure they don't break downstream parsers.
3. **Core Services**: (`services/orchestrator-api`, `services/agent-service`)
   - Complex orchestration logic, caching, token-handling (Token Broker), and delegated access flows should have tests. Database reads/writes (in `infrastructure/`) can be skipped or mocked until higher-level integration tests are necessary.

## Future Work

- Implement integration tests or e2e tests for core UI flows using Playwright.
- Increase coverage thresholds progressively to 80% as the project matures.
- Add test coverage comments directly to PRs.
