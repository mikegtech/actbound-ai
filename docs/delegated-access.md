# Delegated Access Foundation

## Purpose

Phase 4 introduces a delegated-access foundation in `services/orchestrator-api` so ActBound AI can model user-granted provider access, connected accounts, consent state, vault-backed token references, and step-up-sensitive actions without yet requiring production Auth0 integration.

## Delegated Access Model

The shared delegated-access model lives in `packages/sdk` and `packages/authorization`.

- `provider connection`: the upstream account a user connected, including provider label, connection status, granted scopes, and lifecycle state
- `delegated grant`: the delegated access grant tied to a subject and connection
- `consent summary`: the user-facing summary of delegated scopes, lifecycle, and step-up impact
- `vault session`: a safe reference to a delegated vault-backed session or placeholder token handle
- `revocation intent`: the placeholder disconnect/revoke request shape
- `sensitive action classification`: `routine`, `sensitive`, or `high_impact`

## Provider Connection Lifecycle

The placeholder lifecycle is intentionally simple:

1. A user previews or creates a provider connection placeholder.
2. The orchestrator returns safe connection, consent, and vault-session metadata.
3. Sensitive actions can be previewed against that delegated state.
4. Revocation marks the connection, consent, and vault session as revoked in placeholder mode.

This is enough for the demo story while keeping the future Auth0 seams explicit.

## How Token Vault Fits

Today:

- The orchestrator returns safe placeholder connection and vault-session objects.
- Vault sessions expose only safe references such as `vault_ref_demo_001`.
- The token broker uses delegated-access state to shape delegated token responses and cache metadata.

Later:

- Auth0 delegated OAuth completion will create the real delegated grant.
- Auth0 Token Vault APIs will resolve the connected account, delegated grant, and vault-backed token reference.
- The broker will replace placeholder issuance with real delegated token retrieval from Token Vault.

## Delegated Access vs M2M Brokered Access

M2M brokered access:

- uses brokered client-credentials intent
- optimizes repeated machine token demand with cache-first reuse
- does not depend on a user-owned provider connection

Delegated access:

- is tied to a subject, a connected provider account, and delegated grant state
- is re-evaluated through the shared authorization engine before use
- can require step-up for sensitive actions even when the delegated connection exists

## Step-Up Boundary

Step-up is modeled now, but not fully integrated yet.

- The policy engine can return `step_up_required` for `sensitive_actions:execute`.
- Consent preview and broker preview surfaces show whether step-up would be required.
- Real step-up authentication and assertion validation remain TODO seams for a later phase.

## Explicit Future Seams

- TODO: Auth0 delegated OAuth completion
- TODO: Auth0 Token Vault connection and delegated grant APIs
- TODO: Auth0 Token Vault delegated token retrieval
- TODO: Real step-up authentication and verification

This keeps the hackathon story aligned with the judging criteria: strong security model, clear user control, technically coherent architecture, and a believable path from demo-safe placeholders to a production-ready Auth0 integration.
