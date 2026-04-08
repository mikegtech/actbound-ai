---
name: doc-spine-sync
description: >
  Detect drift between architecture docs and skill reference files. Use when
  an architecture document changes and you need to know which skill catalog
  entries are affected, or before committing to verify skill files are still
  accurate. Trigger phrases: "check skill drift", "sync the catalog",
  "docs changed, update skills", "is the catalog still accurate".
compatibility: Designed for Claude Code in a monorepo with docs/ and .claude/skills/
metadata:
  author: mikegtech
  version: "1.0"
allowed-tools: Bash(find:*) Bash(grep:*) Bash(diff:*) Read Edit
---

# Doc Spine Sync Skill

Detect and fix drift between architecture documentation and skill reference
files. Runs as a pre-commit check or on-demand after docs change.

---

## What This Skill Does

1. Reads `references/spine.md` to know which docs map to which skill entries
2. Checks whether the mapped docs have changed since the skill was last synced
3. Reports which catalog entries are likely stale
4. Proposes specific edits to the affected skill files
5. Reminds you to also PR the change back to the skills monorepo

This skill does NOT auto-rewrite catalog entries — it flags drift and proposes
changes for your review.

---

## Workflow

### On-demand (after a doc changes)

```
"The identity model doc changed — check skill drift"
```

1. Read `references/spine.md` to find which skill entries map to that doc
2. Read the changed doc
3. Read the current catalog entry
4. Diff semantically — look for: new actors, renamed services, changed ports,
   new states, removed components
5. Report findings and propose edits

### Pre-commit sweep

```
"Check all skill drift before I commit"
```

1. Run `git diff --name-only HEAD` to find changed files
2. For each changed file, check `spine.md` for affected skill entries
3. Report all stale entries in one pass

---

## Output Format

Always report drift as a table then propose edits:

```
DRIFT DETECTED
──────────────────────────────────────────────────────
Doc changed:    docs/architecture/identity-trust-model.md
Affects:        eraser-diagram → actbound-catalog.md → Diagram 2
Change summary: Multi-issuer section added (Keycloak as second issuer)
Action needed:  Update Diagram 2 sequence to include Keycloak actor path

PROPOSED EDIT
File: .claude/skills/eraser-diagram/references/actbound-catalog.md
Section: Diagram 2 — Identity & Token Flow
Change: Add note "Multi-issuer: auth.trupryce.ai (Keycloak) is the second
        issuer. Auth0 remains issuer 1. Normalisation pipeline maps both
        to internal_subject_id."
```

After editing locally, always remind:

> Also open a PR to `claude-skills/projects/actbound-ai/` with the same change.

---

## Reference Files (load on demand)

| File                  | Load when...                           |
| --------------------- | -------------------------------------- |
| `references/spine.md` | Always — this is the doc→skill mapping |
