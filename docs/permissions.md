# Permission Model

ActBound AI uses `packages/authorization` as the central source of truth for permission modeling and policy evaluation. The package stays framework-agnostic except for the existing Nest guard integration.

## Core Model

The shared permission model is typed in `packages/authorization/src`.

- Actor types: `user`, `agent`, `system`
- Roles: `admin`, `operator`, `viewer`, `service`
- Subject types: `user`, `workspace`
- Resources: `permissions`, `consent_grant`, `vault_connection`, `provider_connection`, `delegated_grant`, `vault_session`, `consent_record`, `sensitive_action`, `agent_action`, `audit_event`, `brokered_token`, `delegated_token`, `token_cache`, `valuation`, `listing`
- Actions: `read`, `use`, `preview`, `execute`, `connect`, `revoke`, `broker`, `inspect`
- Scopes: `connections.read`, `connections.connect`, `connections.revoke`, `consents.read`, `consents.preview`, `agent.preview`, `agent.execute`, `tokens.delegated`, `vault.sessions.read`, `sensitive.execute`, `valuations.execute`, `audit.read`

Authorization context is evaluated from seven explicit parts:

- `actor`: who is attempting the action
- `subject`: who the action is being performed for
- `consent`: delegated grant lifecycle state and delegated scopes
- `tokenVaultConnection`: the Auth0 Token Vault connection surface
- `providerConnection`: the connected upstream provider account
- `vaultSession`: the vault-backed delegated session reference
- `attributes`: request metadata such as tenant, request ID, audience, preview mode, and step-up state

## Permission Catalog

The current centralized permission catalog is:

- `permissions:read`
- `consent_grants:use`
- `vault_connections:use`
- `connections:read`
- `provider_connections:read`
- `provider_connections:connect`
- `provider_connections:revoke`
- `delegated_grants:read`
- `delegated_grants:preview`
- `vault_sessions:read`
- `agent_actions:preview`
- `agent_actions:execute`
- `sensitive_actions:execute`
- `audit_events:read`
- `brokered_tokens:read`
- `brokered_tokens:broker`
- `brokered_tokens:reuse`
- `delegated_tokens:use`
- `token_cache:inspect`
- `valuations:execute`
- `listings:read`

Each permission maps to an explicit policy with:

- allowed actor types
- allowed roles
- resource and action identity
- consent requirements
- Token Vault connection requirements
- provider connection requirements
- vault session requirements
- optional sensitive-action step-up requirements
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
- `delegated_grant_pending`
- `consent_grant_revoked`
- `delegated_grant_expired`
- `consent_scope_missing`
- `vault_connection_missing`
- `vault_connection_unavailable`
- `vault_scope_missing`
- `provider_connection_missing`
- `provider_connection_inactive`
- `vault_session_missing`
- `vault_session_inactive`
- `step_up_required`
- `resource_owner_mismatch`

## What The Policy Engine Evaluates

The central engine can directly evaluate:

- consent grant usage
- Token Vault connection usage
- provider connection viewing, connect, and revoke
- delegated grant viewing and preview
- vault session viewing
- sensitive delegated action execution with step-up markers
- agent action preview
- agent action execution
- audit-event viewing
- brokered token status access
- brokered token issuance access
- brokered token reuse
- delegated token use
- token cache inspection
- service-level operations such as valuations and listing reads

The intent stays the same: explicit policy checks with explicit deny reasons, not hidden logic spread across controllers or React components.

## Enforcement Boundaries

`services/orchestrator-api` is the external-facing decision surface.

- It assembles request authorization context
- It exposes `/me/permissions` for UI consumption
- It exposes delegated-access placeholder endpoints for connections, consents, revocation, and vault session metadata
- It previews delegated consent and step-up impact before sensitive actions proceed
- It exposes safe token broker status, preview, retrieval, and cache-inspection endpoints
- It keeps TODO markers where Auth0 delegated grants, Token Vault APIs, and step-up assertions will later replace header-derived placeholder state

`services/agent-service` is the protected internal re-enforcement layer.

- It does not trust the web app or orchestrator alone
- It re-checks protected operations with the same shared package
- It returns structured allow or deny outcomes, including reason codes through the shared decision object

## UI Rule

`apps/web` consumes backend-issued decisions and context summaries. It does not contain raw policy rules, role matrices, or local consent logic.
