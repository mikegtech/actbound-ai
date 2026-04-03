# ADR-046: Documentation and ADR Standard

## Status

Accepted

## Context

The platform has accumulated significant architectural knowledge across identity, secrets, authorization, enforcement, agents, infrastructure, observability, resilience, and enablement. Without documentation standards, this knowledge becomes tribal and inconsistent.

## Decision

### When an ADR Is Required

- New authorization pattern introduced
- New system integration added
- Security-relevant architectural decision made
- Existing ADR superseded or deprecated
- Tradeoff accepted (document why)

### ADR Format

Title, Status (Accepted / Superseded / Deprecated), Context, Decision, Consequences. Concise. No fluff.

### ADR Numbering

Sequential: `ADR-NNN-short-description.md` in `docs/decisions/`.

### Documentation Locations

| Content             | Location                      |
| ------------------- | ----------------------------- |
| Architecture models | `docs/architecture/`          |
| Decision records    | `docs/decisions/`             |
| Security controls   | `docs/security/`              |
| AI guardrails       | `docs/ai/context.md`          |
| Agent instructions  | `.github/agents/`             |
| API contracts       | `packages/sdk/src/contracts/` |

### New Service/Agent Documentation Requirements

Every new service or agent must produce: ADR (if new patterns), context.md update, API contract (if external), agent file (if agent-scoped).

### Documentation Maintenance

`docs/ai/context.md` is the canonical project state. It must be updated when phases complete, progress milestones are reached, or architectural direction changes.

## Consequences

- All architectural knowledge is recorded and findable.
- New team members can understand "why" by reading ADRs.
- Documentation locations are predictable and consistent.
- The documentation requirement is lightweight — an ADR is a few hundred words, not a design document.
