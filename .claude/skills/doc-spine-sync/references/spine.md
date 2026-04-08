# ActBound AI — Doc Spine

Maps architecture docs to the skill catalog entries they affect.
When a doc changes, check every entry in its row.

---

## Mapping Table

| Doc file                                                | Affects skill    | Affects entry                               | Key signals to watch                                   |
| ------------------------------------------------------- | ---------------- | ------------------------------------------- | ------------------------------------------------------ |
| `docs/architecture/identity-trust-model.md`             | `eraser-diagram` | Diagram 2 — Identity & Token Flow           | New issuers, token types, PKCE changes, M2M changes    |
| `docs/architecture/identity-trust-model.md`             | `eraser-diagram` | Diagram 4 — Agent Delegation                | `on_behalf_of` claim changes, delegation model changes |
| `docs/architecture/authorization-model.md`              | `eraser-diagram` | Diagram 3 — Authorization Decision Pipeline | Layer order, new checks, fail-closed changes           |
| `docs/architecture/authorization-model.md`              | `eraser-diagram` | Diagram 5 — OpenFGA Model                   | New entity types, new relation types, tuple format     |
| `docs/architecture/agent-runtime-security.md`           | `eraser-diagram` | Diagram 4 — Agent Delegation                | Agent identity model, delegation scope changes         |
| `docs/architecture/infrastructure-security-topology.md` | `eraser-diagram` | Diagram 6 — Infra Security Topology         | Zone changes, new services, subnet changes             |
| `docs/architecture/security-observability.md`           | `eraser-diagram` | Diagram 8 — Security Observability          | New event types, new actors, routing changes           |
| `docs/architecture/resilience-recovery.md`              | `eraser-diagram` | Diagram 9 — Resilience & Break-Glass        | State machine changes, new recovery steps              |
| `docs/ai/context.md`                                    | `eraser-diagram` | Diagram 1 — Platform Architecture           | New services, port changes, new external deps          |
| `docs/permissions.md`                                   | `eraser-diagram` | Diagram 3 — Authorization Pipeline          | New permissions, new reason codes, new actor types     |
| `services/orchestrator-api/src/application/resilience/` | `eraser-diagram` | Diagram 7 — Hexagonal Architecture          | New layers, new cross-cutting services                 |
| `services/orchestrator-api/src/application/resilience/` | `eraser-diagram` | Diagram 9 — Resilience & Break-Glass        | State changes in ResilienceService                     |
| `packages/authorization/src/`                           | `eraser-diagram` | Diagram 3 — Authorization Pipeline          | Policy engine changes                                  |
| `README.md`                                             | `eraser-diagram` | Diagram 1 — Platform Architecture           | Stack changes, new key features                        |

---

## Multi-Issuer Watch

When `docs/architecture/identity-trust-model.md` adds a second issuer
(`auth.trupryce.ai` / Keycloak), the following entries need updating:

- **Diagram 2**: Add Keycloak as second issuer actor in sequence; show
  claim normalisation pipeline mapping both issuers to `internal_subject_id`
- **Diagram 6**: Add `auth.trupryce.ai` as an external service zone
- **Diagram 1**: Add Keycloak to EXTERNAL SERVICES zone

---

## How to Use This File

Claude Code reads this file first, then:

1. Finds the row(s) matching the changed doc
2. Reads the current content of the affected catalog entry
3. Reads the changed doc section
4. Reports specific drift and proposes edits

If a changed file has no row in this table, it does not affect any skill
catalog entry — no action needed.
