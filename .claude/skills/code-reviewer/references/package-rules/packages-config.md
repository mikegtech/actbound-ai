# Package Rules — packages/config

## Role

`packages/config` contains shared linting, formatting, and TypeScript configuration standards.

It affects the whole monorepo and must be treated as governance infrastructure.

## Reviewer priorities

1. preserve repo-wide developer ergonomics without weakening safeguards
2. avoid changes that silently reduce code quality or reviewability
3. maintain compatibility across apps, services, and packages

## Flag as blocker

- disabling important safety, type, lint, or formatting protections without clear justification
- changes that weaken secret-prevention or secure coding hygiene indirectly
- repo-wide config changes likely to mask real defects

## Flag as high severity

- config divergence that breaks expected behavior across monorepo areas
- changes that increase ambiguity in import boundaries or type safety
- undocumented config changes with broad blast radius

## Review for

- blast radius of config changes
- compatibility with monorepo structure
- alignment with repository guardrails and CI expectations
- no accidental weakening of strict type or lint discipline

## Testing expectations

Require validation for:

- changed lint/build/typecheck outcomes
- affected packages/apps compile behavior
- CI alignment where config changes impact automation
