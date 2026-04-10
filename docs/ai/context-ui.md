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

- rename `apps/web` to the expected workspace package identity so root `pnpm --filter @actbound/web ...` workflows resolve correctly
- replace the `/` starter route with an ActBound landing/default dashboard experience
- remove template auth sitemap/path entries that do not map to the active router
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

- make the dashboard the actual default authenticated landing experience rather than an alternate route behind `/dashboard`
- add direct dashboard navigation/actions into core product domains so the landing view behaves like a control plane entry point
- make shared breadcrumb/page-level navigation router-aware so in-app transitions stay inside the SPA shell
- tighten dashboard copy and summary framing where it still reads as generic dashboard content instead of ActBound-specific control-plane guidance

### Phase 2 — Assistants

Completed.

Summary:

- assistants index implemented
- assistant detail foundation established
- assistant-specific status/capability/summary patterns introduced
- UI framing emphasizes bounded assistant authority

Outcome:

- assistants are now a real product surface instead of placeholders

### Phase 3 — Organizations + Resources

Completed.

Summary:

- organizations index and detail foundation implemented
- resources index and detail foundation implemented
- governance and protection signals introduced
- relationship-oriented summaries now connect assistants, organizations, and resources

Outcome:

- organizations and resources now function as visible trust boundaries in the UI

### Phase 4 — Policies

Completed.

Summary:

- policies index implemented
- policy detail foundation established
- policy simulation / trace foundation introduced
- policy scope, impact, and denial/warning concepts became visible UI surfaces

Outcome:

- the authorization model is now represented in the UI beyond simple summaries

### Phase 5 — Delegations + Connected Accounts

Ready / in progress depending on latest Codex completion status.

Expected scope:

- delegations index
- delegation detail or expandable detail pattern
- connected accounts coverage
- delegation/account-specific summaries and status semantics

If Codex has completed this phase successfully, treat it as complete and update the status lines below accordingly.

---

## Current Status Summary

### Complete

- Phase 2 — assistants
- Phase 3 — organizations + resources
- Phase 4 — policies

### Complete with follow-up required

- Phase 0 — UI hardening
- Phase 1 — shell refinement + dashboard foundation

### In progress / just executed

- Phase 5 — delegations + connected accounts

### Remaining

- Phase 6 — security
- Phase 7 — audit
- Phase 8 — settings + polish

---

## What Is Left

### Phase 0 — UI hardening follow-up

Need to complete:

- rename `apps/web` from `vite-ts-starter` to the intended workspace package identity so monorepo root scripts work again
- retire the current starter page at `/` and route authenticated users into a real ActBound landing surface
- remove stale auth/template sitemap and path entries that are not backed by live routes
- finish template cleanup in `apps/web` docs, config labels, sample credentials, translations, and unused starter references

### Phase 1 — Shell refinement + dashboard foundation follow-up

Need to complete:

- make the dashboard the default entry surface for authenticated users
- add meaningful route-linked actions from the dashboard into assistants, policies, resources, delegations, security, and audit
- update shared breadcrumb navigation to use router-aware links instead of full-page reload paths
- run a copy/polish pass on the dashboard so the primary landing surface consistently reads as an ActBound control plane
- review whether the current dashboard sections are the right phase-appropriate foundation versus carrying placeholder summary blocks forward unchanged

### Phase 6 — Security

Need to implement:

- security dashboard
- my security controls or equivalent user-facing security view
- token/account/delegation risk or posture indicators
- security-specific summary blocks
- attention/health patterns
- coherence with delegations, policies, and resources

### Phase 7 — Audit

Need to implement:

- audit log index/overview
- security events or activity exploration
- timeline/event summary patterns
- event detail or expandable event inspection
- filters/search only if needed for a clean foundation
- visible linkage back to assistants, delegations, policies, and resources

### Phase 8 — Settings + polish

Need to implement:

- settings foundation
- route completeness review
- consistency pass across headers, empty/loading/error states, spacing, and navigation
- shared primitive cleanup opportunities
- responsive cleanup
- final template residue removal
- prep for real API/data integration work

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

1. Fix Phase 0 completion gaps
2. Fix Phase 1 completion gaps
3. Finish or confirm Phase 5 Delegations + Connected Accounts
4. Implement Phase 6 Security
5. Implement Phase 7 Audit
6. Implement Phase 8 Settings + polish
7. After those UI foundations are complete, plan a focused integration pass for real gateway-backed data flows

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

- **Phase 6 — Security**

After Security, continue with:

- Phase 7 — Audit
- Phase 8 — Settings + polish
