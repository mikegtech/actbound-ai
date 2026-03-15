# Permission Model

ActBound AI uses `packages/authorization` as the central source of truth for permission modeling and policy evaluation. The package is framework-agnostic apart from the existing Nest guard integration points.

## Core Model

The shared permission model is typed in `packages/authorization/src`.

- Actor types: `user`, `agent`, `system`
- Roles: `admin`, `operator`, `viewer`, `service`
- Subject types: `user`, `workspace`
- Resources: `permissions`, `consent_grant`, `vault_connection`, `agent_action`, `audit_event`, `valuation`, `listing`
- Actions: `read`, `use`, `preview`, `execute`

Authorization context is evaluated from five explicit parts:

- `actor`: who is attempting the action
- `subject`: who the action is being performed for
- `consent`: delegated user-consent grant status and scopes
- `tokenVaultConnection`: Token Vault connection status and scopes
- `attributes`: request metadata such as tenant, request ID, audience, internal-call marker, and preview mode

## Permission Catalog

The current centralized permission catalog is:

- `permissions:read`
- `consent_grants:use`
- `vault_connections:use`
- `connections:read`
- `agent_actions:preview`
- `agent_actions:execute`
- `audit_events:read`
- `valuations:execute`
- `listings:read`

Each permission maps to an explicit policy with:

- allowed actor types
- allowed roles
- resource and action identity
- consent requirements
- Token Vault connection requirements
- optional subject-ownership checks

## Decision Model

The policy engine returns a structured allow or deny decision with:

- `permission`
- `resource`
- `action`
- optional `resourceId`
- `allowed`
- `reasons[]`

Reason codes are shared and typed. Current codes include:

- `policy_allow`
- `authorization_context_missing`
- `actor_roles_missing`
- `actor_type_not_allowed`
- `role_grant_missing`
- `consent_grant_missing`
- `consent_grant_revoked`
- `consent_scope_missing`
- `vault_connection_missing`
- `vault_connection_unavailable`
- `vault_scope_missing`
- `resource_owner_mismatch`

## What The Policy Engine Evaluates

The central engine can directly evaluate:

- consent grant usage
- Token Vault connection usage
- agent action preview
- agent action execution
- audit-event viewing
- general permission checks for service-level operations such as valuations and listing reads

The intent is simple: explicit policy checks with explicit deny reasons, not hidden logic spread across controllers or React components.

## Enforcement Boundaries

`services/orchestrator-api` is the external-facing decision surface.

- It assembles request authorization context
- It exposes `/me/permissions` for UI consumption
- It evaluates preview and execute requests before downstream work
- It keeps TODO markers where Auth0 delegated grants and Token Vault token exchange will later replace header-derived placeholder context

`services/agent-service` is the protected internal re-enforcement layer.

- It does not trust the web app or orchestrator alone
- It re-checks protected operations with the same shared package
- It returns structured allow or deny outcomes, including reason codes through the shared decision object

## UI Rule

`apps/web` consumes backend-issued decisions and context summaries. It does not contain raw policy rules or role matrices.
