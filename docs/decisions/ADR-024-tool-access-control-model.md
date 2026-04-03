# ADR-024: Tool Access Control Model

## Status

Accepted

## Context

Agents use tools to perform actions — reading data, calling APIs, creating records, sending messages. Different tools carry different risk levels. We need a model that gates tool access based on risk, delegation status, and authorization.

## Decision

### Tool Categories

| Category           | Risk     | Examples                             | Authorization required                       |
| ------------------ | -------- | ------------------------------------ | -------------------------------------------- |
| Read-only internal | Low      | Query data, list resources           | RBAC + OpenFGA project access                |
| Read-only external | Medium   | Search Google, read Slack            | Delegation + Token Vault consent             |
| Write internal     | High     | Create/update records                | RBAC + OpenFGA + ABAC ownership              |
| Write external     | High     | Send email, post to Slack            | Delegation + Token Vault + step-up           |
| Destructive        | Critical | Delete resources, revoke connections | Delegation + step-up + explicit confirmation |

### Dual-Phase Checking

1. **Before planning:** Agent checks if the tool category is available (RBAC). Prevents wasted computation.
2. **Before execution:** Full authorization check (RBAC + ABAC + OpenFGA + delegation). Definitive authorization.

Both phases are mandatory for write and destructive tools. Read-only tools may skip the planning phase.

### Tool Registration

Every tool is registered with metadata that the authorization system uses:

- Tool ID, category, required permission
- Whether delegation is required
- Whether step-up is required
- Required consent/Token Vault scopes

### Enforcement

Tool access is enforced by the same `AuthorizationService` as all other permissions. Tools do not have their own authorization system. The tool registration metadata maps to the standard RBAC + ABAC + OpenFGA evaluation.

## Consequences

- Risk-proportional authorization: read-only tools have lightweight checks, destructive tools have maximum scrutiny.
- Agents cannot plan with tools they can't use (early feedback).
- Execution-time checks are definitive regardless of planning-time results.
- Tool registration is declarative — adding a new tool means adding a registration, not new authorization code.
