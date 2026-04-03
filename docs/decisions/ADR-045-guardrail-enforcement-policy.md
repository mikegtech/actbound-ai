# ADR-045: Guardrail Enforcement Policy

## Status

Accepted

## Context

Even with shared SDKs and templates, developers can bypass platform patterns by writing custom code. We need guardrails that catch violations before they reach production.

## Decision

### Forbidden Patterns

| Pattern                                                  | Enforcement                           |
| -------------------------------------------------------- | ------------------------------------- |
| Hardcoded secrets                                        | Gitleaks (pre-commit + CI)            |
| Direct Secrets Manager SDK calls (bypassing Secrets SDK) | Code review + ESLint rule (future)    |
| Inline authorization logic in controllers                | Code review + agent instructions      |
| Raw OpenFGA calls outside Authorization SDK              | Code review + agent instructions      |
| CASL as backend authorization                            | Code review + ADR-020                 |
| Repo-wide `prettier --write .` or `eslint --fix .`       | Pre-commit hook + AI guardrails       |
| Shared agent identities                                  | ADR-007 + provisioning process        |
| Secret values in environment variables                   | Code review + `.env.example` template |

### CI Enforcement

Every PR is validated by: lint, format, typecheck, build, test (with coverage thresholds), secret scanning, SAST (Semgrep + CodeQL), dependency review, and workflow linting (actionlint).

### Security Review Triggers

PRs modifying `.github/workflows/`, `packages/authorization/`, `.gitleaks.toml`, `.pre-commit-config.yaml`, `docs/decisions/ADR-*`, or any new service/agent require CODEOWNERS review.

### Progressive Enforcement

Start with code review and agent instructions. Add automated ESLint rules as patterns stabilize. Never rely solely on human review for security-critical patterns.

## Consequences

- Forbidden patterns are caught before production.
- CI provides automated enforcement for measurable checks.
- CODEOWNERS ensures human review for security-critical paths.
- The guardrail set grows over time as the platform matures.
