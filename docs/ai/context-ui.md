# ActBound UI Context

## Purpose

This document is the working frontend context for `apps/web` in `actbound-ai`.

The UI is the control plane for ActBound AI: a governed, auditable system where AI assistants act within explicit authorization boundaries using a decoupled SPA architecture and a standalone API gateway.

This file is the source of truth for frontend implementation direction, completed UI phases, remaining work, agent rules, and the next recommended steps.

---

## Non-Negotiable Architecture

### Core rules

- The frontend is always a **decoupled SPA**.
- The system always exposes a **standalone API gateway** as the public backend boundary.
- The browser must never depend on internal service topology.
- Frontend code must target **gateway-facing contracts** only.
- The UI must remain independently deployable from backend services.
- Frontend agents must not change backend behavior.

### Frontend-only boundary

Codex is being used for UI implementation.

Codex must:

- work in `apps/web`
- optionally update frontend-oriented docs such as this file
- consume `@actbound/ui` and `@actbound/sdk` where appropriate
- avoid backend/API behavior changes

Codex must not:

- modify backend services
- modify gateway handlers
- modify orchestrator logic
- modify database code
- modify auth server behavior
- change API semantics
- introduce backend assumptions not already established

If a UI flow needs unavailable data, use typed frontend-only mocks/placeholders.

---

## Template and Workspace Package Policy

### Template policy

- `apps/web` is the implementation base.
- The trimmed React starter in `apps/web` is the active application shell.
- The full `vite-ts` template in the repo is **read-only donor/reference material only**.
- Do not copy whole demo pages from the reference template.
- Adapt patterns into ActBound-specific primitives and screens.

### Workspace package policy

The frontend depends on:

- `@actbound/sdk`
- `@actbound/ui`

#### `@actbound/ui`

Use as the first place to look for:

- shared primitives
- common layout patterns
- reusable display components
- theme-consistent presentation building blocks

Keep components in `apps/web` only when they are:

- page-specific
- route-specific
- feature-composition-specific
- clearly ActBound-domain-specific

#### `@actbound/sdk`

Use as the first place to look for:

- frontend-safe shared types
- schemas
- UI-consumable contracts

Do not change API semantics through SDK edits.
If a type gap exists, use a narrow local temporary type and note it as a follow-up for later SDK consolidation.

---

## Current Frontend Stack

Preserve and build on the existing stack:

- React
- TypeScript strict mode
- Vite
- MUI
- TanStack Router
- TanStack Query
- Zustand
- React Hook Form
- Zod
- Axios
- Biome

Do not introduce major dependencies unless justified.

---

## State Management Rules

### Server state

TanStack Query is the standard for server state.

Rules:

- all server-backed data should flow through Query-backed hooks
- do not use ad hoc page-level `useEffect + axios` for standard data fetching
- mutations should eventually invalidate or update known query keys
- keep data access organized behind frontend utilities/hooks

### Client state

Zustand is for true client-only UI state only.

Examples:

- nav collapse
- local filters
- modal/drawer visibility
- transient wizard state
- UI preferences

Do not put fetched entity lists or records into Zustand.

---

## Canonical Product Domains

The top-level UI domains are:

- Dashboard
- Assistants
- Organizations
- Resources
- Policies
- Delegations
- Security
- Audit
- Settings

Do not invent new top-level product domains without intentionally updating this context.

---

## Product Intent

ActBound is not a generic analytics dashboard or admin panel.

The UI must help users understand:

- who or what is acting
- on whose behalf an assistant can act
- which organizations and resources are in scope
- what policies govern access
- what delegations and connected accounts exist
- what security posture looks like
- what audit evidence exists

Every major screen should make trust boundaries more legible.

---

## Route and Experience Direction

Recommended top-level route direction:

- `/dashboard`
- `/assistants`
- `/assistants/$assistantId`
- `/organizations`
- `/organizations/$organizationId`
- `/resources`
- `/resources/$resourceId`
- `/policies`
- `/policies/$policyId`
- `/policies/simulate`
- `/delegations`
- `/delegations/$delegationId` or equivalent detail pattern if adopted
- `/security`
- `/security/my-controls` if needed
- `/audit`
- `/settings`

Exact route filenames may vary with current TanStack Router conventions, but the information architecture should follow this model.

---

## Shared UI Direction

The UI vocabulary should be ActBound-specific and reusable across phases.

Preferred reusable patterns include:

- page header/title pattern
- section/card wrapper
- metric/stat card
- empty state
- loading state
- error state
- summary blocks
- detail panels
- status badges
- timeline or recent-activity snapshots
- relationship summary sections

Prefer `@actbound/ui` first.
Add app-local primitives only when the component is domain-specific or route-specific.

---

## Completed Work

### Phase 0 — UI hardening

Implemented, but review follow-up remains.

Summary:

- architectural expectations documented
- ActBound domain map established
- route/sitemap/path direction aligned to core domains
- leftover demo semantics removed or reduced
- placeholder pages created for core domains
- frontend-only boundary reinforced
- workspace package references updated, but package identity cleanup remains
- build stability restored

Outcome:

- the shell is now largely positioned as an ActBound app rather than a generic template

Still needs completion:

- remove remaining template residue in app docs, settings labels, sample credentials, and starter-specific copy/assets

### Phase 1 — Shell refinement + dashboard foundation

Implemented, but review follow-up remains.

Summary:

- dashboard moved from placeholder toward a meaningful ActBound landing experience
- shared page/section/metric/empty-state vocabulary improved
- shell polish advanced enough to support future domains
- dashboard framing shifted toward delegated AI control plane language

Outcome:

- the app now has reusable page composition patterns and a stronger dashboard foundation

Still needs completion:

- review dashboard summary blocks again when gateway-backed metrics replace frontend mock data

### Phase 2 — Assistants

In progress.

Summary:

- assistants index implemented
- assistant detail foundation established
- assistant-specific status/capability/summary patterns introduced
- UI framing emphasizes bounded assistant authority

Outcome:

- assistants are now a real product surface instead of placeholders, but visible controls and boundary semantics still need a completion pass

Still needs completion:

- make assistant filters, creation, editing, restriction, rules, and thresholds functional when those flows are in scope
- make assistant detail pages show clearer trust-boundary relationships to resources, delegations, policies, and audit/security signals

### Phase 3 — Organizations + Resources

Implemented, but follow-up required.

Summary:

- organizations index and detail foundation implemented
- resources index and detail foundation implemented
- governance and protection signals introduced
- relationship-oriented summaries now connect assistants, organizations, and resources

Outcome:

- organizations and resources now function as visible trust boundaries in the UI, but several metrics, relationships, and actions are still placeholder-level

Still needs completion:

- replace count-only or empty relationship blocks with linked assistants, resources, delegations, policies, audit, and security context
- make organization/resource filters, export, settings, access review, attached policies, audit history, and review actions functional when those flows are in scope

### Phase 4 — Policies

Implemented, but follow-up required.

Summary:

- policies index implemented
- policy detail foundation established
- policy simulation / trace foundation introduced
- policy scope, impact, and denial/warning concepts became visible UI surfaces

Outcome:

- the authorization model is now represented in the UI beyond simple summaries, but simulation correctness, policy logic, and visible actions need a completion pass

Still needs completion:

- make recent changes and policy hierarchy data real mock records instead of fixed narrative content
- make policy filters, creation, editing, history, and metric review functional when those flows are in scope

### Phase 5 — Delegations + Connected Accounts

In progress.

Summary:

- delegations index implemented with active delegation and connected account tabs
- typed mock delegation and connected account data introduced
- delegation and connection status badges implemented
- loading, empty, and error states are present for the tabbed surfaces

Outcome:

- the Trust Core surface exists, but delegation detail, connection management, and cross-entity relationship depth remain incomplete

Still needs completion:

- implement a delegation detail route or expandable detail pattern
- implement Manage Connection and any future grant/revoke actions through safe mutation flows
- connect delegation and connected-account records to real assistant, organization, policy, resource, audit, and security mock IDs
- add an aggregate status/attention summary so the page communicates delegation risk and account health at a glance
- align connected account and delegation terminology with the rest of the app so Trust Core, delegations, integrations, and security controls read as one model

### Phase 6 — Security

In progress.

Summary:

- security dashboard route implemented
- My Controls route implemented
- posture, risk, and denied-policy snapshot cards introduced
- token/account/delegation risk concepts are visible in the UI

Outcome:

- security is now a navigable product surface, but it is still a static/mock shell with incomplete safety affordances

Still needs completion:

- derive My Controls content from typed mock/query data instead of fixed copy
- link risk and denial cards back to the source assistant, connected account, delegation, policy, resource, or audit event
- reconcile the controls route/copy with the broader security, delegation, and connected-account model

### Phase 7 — Audit

Implemented, but follow-up required.

Summary:

- audit index route implemented
- typed mock audit event records introduced
- clickable audit table implemented
- event inspection drawer implemented with decision reasons and metadata

Outcome:

- audit exploration has a usable foundation, but event linkage and investigation depth still need refinement

Still needs completion:

- add actor, signal, event type, resource, and time filters once the mock event count grows beyond the current fixed table
- populate organization, assistant, delegation, policy, and resource identifiers consistently so audit events can link back to source pages
- expand decision context beyond generic metadata so policy evaluation reasons explain what happened and why
- add pagination or a deliberate fixed-window model before audit data grows
- review raw metadata rendering for sensitive fields before wiring real event payloads

### Phase 8 — Settings + polish

In progress.

Summary:

- settings route implemented
- tabbed settings foundation introduced
- identity, defaults, integrations, and security/auth panels are visible

Outcome:

- settings has a page shell, but most controls are static placeholders and the route still needs a polish pass

Still needs completion:

- convert profile fields and settings controls to typed mock/query-backed state or disable them as placeholders
- implement safe mutation flows for Save Identifiers, Toggle Default, Revoke All Sessions, and other settings actions
- align integration settings with connected-account data beyond read-only explanatory copy
- improve responsive behavior for the vertical tab layout on mobile widths
- run the final cross-route polish pass for headers, empty/loading/error states, spacing, navigation, and remaining template residue

---

## Production Follow-Up Triage Sprint 1

Completed in this sprint:

- confirmed `apps/web` already uses the `@actbound/web` package identity
- kept `/` routed to the dashboard and protected the main shell so unauthenticated users enter through login
- kept dashboard route-linked actions as the landing entry points into assistants, policies, resources, delegations, security, and audit
- added functional frontend search to assistant, organization, resource, and policy list pages
- replaced silent no-op mutation-looking controls with disabled, explained affordances across assistants, organizations, resources, policies, delegations, security controls, and settings
- made policy simulation traces policy-specific and blocked missing/mismatched traces with an honest empty state
- populated policy logic from typed frontend policy conditions using the existing SDK `PolicyCondition` type
- derived resource summary metrics from the resource mock data instead of hardcoded contradictory totals
- normalized resource organization ownership to stable IDs/names and linked resource owners to organization detail routes
- fixed frontend TypeScript issues found during the sprint so `@actbound/web` now passes `tsc --noEmit`

---

## Current Status Summary

### Complete

- None currently reviewed as complete with no follow-up

### Complete with follow-up required

- Phase 0 — UI hardening
- Phase 1 — shell refinement + dashboard foundation
- Phase 3 — organizations + resources
- Phase 4 — policies
- Phase 7 — audit

### In progress / just executed

- Phase 2 — assistants
- Phase 5 — delegations + connected accounts
- Phase 6 — security
- Phase 8 — settings + polish

### Remaining

- None

---

## What Is Left

### Phase 0 — UI hardening follow-up

Need to complete:

- finish template cleanup in `apps/web` docs, config labels, sample credentials, translations, and unused starter references

### Phase 1 — Shell refinement + dashboard foundation follow-up

Need to complete:

- revisit dashboard summary blocks when real gateway-backed metrics replace frontend mock data

### Phase 2 — Assistants follow-up

Need to complete:

- implement assistant filters, creation, editing, restriction, rule configuration, and threshold review when those flows are in scope
- strengthen assistant detail pages with linked boundary context for reachable resources, delegated accounts, governing policies, and relevant audit/security signals

### Phase 3 — Organizations + Resources follow-up

Need to complete:

- replace placeholder relationship summaries with linked assistants, resources, delegations, policies, audit, and security context
- implement organization/resource filters, export, settings, access review, attached-policy, audit-history, and review-action flows when they are in scope

### Phase 4 — Policies follow-up

Need to complete:

- replace fixed recent-change and hierarchy narratives with typed mock records
- implement policy filters, creation, editing, history, metric review, and other visible policy actions when those flows are in scope

### Phase 5 — Delegations + Connected Accounts follow-up

Need to complete:

- implement delegation detail or expandable detail
- implement Manage Connection and any future grant/revoke actions through safe mutation flows
- link delegations and connected accounts to assistants, organizations, policies, resources, audit, and security data
- add aggregate delegation/account posture summaries
- align Trust Core, integration, delegation, and security-control language across pages

### Phase 6 — Security follow-up

Need to complete:

- back My Controls with typed mock/query data instead of fixed copy
- link risks and denials to source assistants, connected accounts, delegations, policies, resources, or audit events
- reconcile security controls with delegation and connected-account state

### Phase 7 — Audit follow-up

Need to complete:

- add filters/search/sorting once event volume requires it
- populate source entity IDs consistently so events can link to assistants, delegations, policies, resources, organizations, and security findings
- enrich decision reasons with policy evaluation context
- add pagination or an explicit fixed-window model before expanding event data
- review raw metadata rendering before connecting real audit payloads

### Phase 8 — Settings + polish follow-up

Need to complete:

- make settings fields controlled and mock/query-backed, or disable them as placeholders
- implement safe mutation flows for Save Identifiers, Toggle Default, Revoke All Sessions, and other mutation-looking controls
- align the integrations panel with connected account data beyond read-only explanatory copy
- improve mobile behavior for the vertical settings tabs
- complete the final cross-route consistency and template-residue pass

---

## Known Constraints and Working Assumptions

- Real backend integrations are not yet the priority for these UI phases.
- Mock-first implementation remains acceptable and preferred when real contracts are not ready.
- The frontend should remain easy to swap from mock data to gateway-backed query hooks later.
- Shared package consolidation is allowed as a future refinement topic, but large shared-package refactors are not a priority during these phased UI builds.
- Security and audit surfaces must become increasingly explicit as phases advance.

---

## Definition of Done for a Page

A page is not complete unless it includes:

- route wired
- ActBound-aligned title/header
- typed data shape or mock
- loading state
- empty state
- error state
- coherent spacing/layout
- no leftover generic demo/template text
- visual alignment with the existing shell and domain model

---

## Agent Rules for Ongoing UI Work

### Antigravity

Use Antigravity for:

- page implementation
- route/page scaffolding
- incremental UI composition
- mock-first domain surfaces
- local feature components
- frontend-only docs updates

Antigravity must not:

- change backend behavior
- redesign API semantics
- introduce backend coupling

### Claude Code

Use Claude Code for:

- backend/API work
- contract/server implementation
- architecture review
- cross-layer consistency review
- follow-up on integration alignment

---

## Recommended Next Steps

1. Finish remaining template cleanup in app docs, config labels, sample credentials, translations, and unused starter references
2. Add relationship depth across assistants, organizations, resources, delegations, policies, audit, and security findings
3. Decide which disabled placeholder actions should become frontend-only mock flows before gateway integration
4. Replace fixed recent-change, policy hierarchy, and My Controls narratives with typed mock records
5. After those UI foundations are coherent, plan a focused integration pass for real gateway-backed data flows

---

## Follow-Up Cleanup Opportunities

These are valid later, but not current blockers:

- promote repeated app-local primitives into `@actbound/ui`
- consolidate repeated local mock types into clearer feature-owned models
- align any temporary local types with `@actbound/sdk` once shared contracts are stable
- standardize query key factories when real integration begins
- review detail-route consistency across all top-level domains

---

## Next Prompt Target

The next recommended prompt is:

- **Relationship-depth and typed mock data linkage triage**

Start with:

- assistant, resource, delegation, policy, audit, and security cross-links
- delegation detail or expandable detail
- typed mock records for policy history, policy hierarchy, and My Controls
