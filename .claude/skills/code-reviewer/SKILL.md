---
name: code-reviewer
description: Reviews pull requests, commits, and diffs for skill-registry governance, including skill-spec compliance, instruction quality, routing metadata quality, tool permission safety, and shared-versus-project overlay correctness. Use when reviewing changes to skills, references, scripts, assets, project overlays, package rules, or repository governance files.
license: Proprietary
compatibility: Designed for repository review workflows in skill registries and project overlay monorepos.
metadata:
  owner: skills-registry
  review_scope: governance-and-quality
  review_targets: shared-skills project-overlays repo-governance pull-requests diffs
---

# Code Reviewer

## Purpose

Review repository changes as a governed skills registry.

This skill is not a generic style checker. It is a policy-driven reviewer for:

- skill specification correctness
- skill quality and discoverability
- project overlay correctness
- repository governance and reviewability
- agent safety and safe mergeability

Prioritize structural validity, security and capability boundaries, routing quality, maintainability, and safe reviewer output.

## When to use

Use this skill when reviewing:

- pull requests
- commit diffs
- changed files
- new skills
- updates to `SKILL.md`
- changes to `references/`, `scripts/`, or `assets/`
- project-specific overlays under `projects/<project>/`
- registry governance files
- monorepo package/app review profiles
- repository automation or protected-path changes

## Inputs

Review whatever change context is available:

- changed file list
- unified diff or patches
- pull request title and body
- relevant surrounding repository files
- repository governance documents
- project overlay reference files
- package-specific review rules
- cross-cutting review rules

If the exact diff is not available, review the files and state any resulting uncertainty explicitly.

## Required output

Produce all of the following:

1. Overall verdict
2. Blockers
3. High-severity findings
4. Advisory findings
5. Safe autofix suggestions, only when deterministic and low-risk
6. Missing context or uncertainty notes, if applicable

Each finding should include:

- severity
- file path or affected area
- why it matters
- concrete remediation guidance

## Reviewer stance

Be strict on:

- structure
- boundary preservation
- safety
- tool permission scope
- fail-closed behavior
- contract consistency
- shared versus project ownership

Be practical on:

- wording
- stylistic preferences
- non-functional phrasing improvements

Prefer concrete fixes over vague criticism.

Do not invent repository facts. When a conclusion depends on inference, say so.

## Review order

Always review in this order:

1. skill-spec or repository-structure compliance
2. safety, tool permissions, and protected-path impact
3. shared versus project ownership correctness
4. path-based package/app rule compliance
5. cross-cutting auth, contract, observability, testing, and dependency boundary impact
6. instruction quality and routing metadata quality
7. progressive disclosure and repository hygiene
8. duplication, drift, and maintainability
9. style and wording last

## Operating model

This reviewer uses:

- shared governance rules
- project-specific overlays
- package-specific rules for monorepos
- cross-cutting rules triggered by change type

The reviewer must determine which review context to load before forming conclusions.

## Context resolution

### Step 1 — Identify review target type

Classify the change into one or more of these groups:

- shared skill change
- project overlay change
- package/app rule change
- cross-cutting rule change
- repository governance change
- scripts/assets/references change
- CI/automation/configuration change
- documentation/ADR change

### Step 2 — Load base governance context

Always load repository governance context for the current repository under review.

For the skills registry itself, this means loading:

- `projects/skills-registry/code-reviewer/references/repo-review-profile.md`
- `projects/skills-registry/code-reviewer/references/registry-rules.md`
- `projects/skills-registry/code-reviewer/references/naming-conventions.md`
- `projects/skills-registry/code-reviewer/references/skill-quality-bar.md`
- `projects/skills-registry/code-reviewer/references/protected-paths.md`

If one of these files is missing, continue the review and call out the missing governance context explicitly.

### Step 3 — Resolve project overlay context

If the changes touch:

- `projects/<project>/...`

Then load:

- `projects/<project>/code-reviewer/references/`

If changes touch `shared/`, also load the registry governance context because shared changes are governed at platform level.

If both shared and project paths change, review both contexts:

- shared files against registry/platform rules
- project files against the relevant project overlay rules

### Step 4 — Resolve monorepo package/app rules

If the target project is a monorepo and exposes package/app rules, map changed paths to package rules.

For ActBound AI, route using `projects/actbound-ai/code-reviewer/references/review-routing.md`.

Load package-specific rule files for changed paths such as:

- `apps/web/**`
- `services/orchestrator-api/**`
- `services/agent-service/**`
- `services/sync-service/**`
- `packages/authorization/**`
- `packages/openfga/**`
- `packages/sdk/**`
- `packages/ui/**`
- `packages/config/**`

If no package-specific rule file exists for a changed path, fall back to:

- project review profile
- monorepo topology
- protected paths
- relevant cross-cutting rules

State that path-specific rule coverage is missing.

### Step 5 — Resolve cross-cutting rule files

Load cross-cutting rule files when triggered by the change type.

Typical triggers include:

- auth, claims, permissions, OpenFGA, delegation, issuer handling, tenant handling → auth-and-permissions
- DTOs, schemas, typed clients, OpenAPI, contract payloads → api-contracts
- logs, traces, metrics, audit events, request correlation, workflow attribution → observability
- behavior changes, route changes, policy changes, repo-wide config changes → testing-expectations
- new imports, new dependencies, package coupling, framework leakage → dependency-boundaries

If cross-cutting impact is obvious but the project has no corresponding rule file, say so and review using reasonable repository evidence.

## Skill-registry review duties

### 1. Skill-spec compliance

For each skill directory under review:

- verify `SKILL.md` exists when required
- verify YAML frontmatter exists
- verify `name` matches the parent directory name
- verify `description` is specific and useful
- verify optional fields are sensible when present
- verify relative file references point to real files
- verify `scripts/`, `references/`, and `assets/` are used appropriately

Flag:

- invalid structure
- missing required fields
- weak descriptions
- broken references
- misplaced files that weaken predictability

### 2. Routing metadata quality

Treat `description` as routing metadata, not filler text.

Flag descriptions that:

- are vague
- fail to explain when to use the skill
- omit important routing cues or keywords
- read like marketing copy rather than operational guidance

### 3. Instruction quality

Review whether the body of `SKILL.md` is actionable.

Look for:

- clear task sequence
- concrete success criteria
- examples where useful
- failure modes or edge cases where risk is meaningful
- scope discipline
- cues about what the skill should not do when relevant

Flag skills that explain intent but not execution.

### 4. Progressive disclosure

Prefer concise `SKILL.md` files with details moved into `references/`, executable logic in `scripts/`, and static resources in `assets/`.

Flag:

- bloated main instructions
- repeated content that belongs in references
- deeply nested reference chains
- documentation layout that wastes context

### 5. Shared versus project ownership

Flag:

- project-specific content leaking into shared skills
- duplicated instructions across shared and project overlays
- silent divergence between shared skill behavior and project references
- unclear ownership of rules or reference material

### 6. Tool permission governance

When `allowed-tools` or equivalent execution permissions are present, review for scope safety.

Flag:

- broader permissions than needed
- high-risk tools without clear justification
- permissions inconsistent with the stated skill purpose

### 7. Registry governance and reviewer integrity

For changes to governance files, review for:

- weakening of standards
- ambiguity in reviewer expectations
- drift in severity handling
- risky autofix expansion
- protected-path weakening
- merge-safety regressions

## Monorepo review duties

When the target project is a monorepo, review both local correctness and architectural alignment.

Check for:

- path-specific rule compliance
- cross-package contract drift
- frontend/backend/shared-package boundary violations
- framework leakage into shared packages
- unsafe dependency direction
- missing tests for security-sensitive or behavior-changing paths
- incomplete observability or audit impact for security-relevant changes

## Severity model

### Blocker

Use blocker when the change causes or is likely to cause any of the following:

- invalid skill structure
- broken or misleading routing metadata
- unsafe tool permission expansion
- shared/project boundary violation with behavioral impact
- auth bypass or permission widening
- fail-open behavior on auth or authorization paths
- contract-breaking changes without required coordinated updates
- framework or persistence leakage into protected shared package boundaries
- protected-path changes that weaken controls
- security-relevant behavior changes without adequate verification

### High

Use high severity when the change causes or is likely to cause:

- weak or incomplete instructions that could cause misuse
- broken references or incomplete supporting files
- duplicated or conflicting guidance
- meaningful observability or auditability regression
- insufficient tests for meaningful behavior change
- mixed-path monorepo coupling likely to cause drift
- unclear ownership across layers or packages

### Advisory

Use advisory for:

- naming improvements
- clarity improvements
- suggestions to extract shared guidance
- small maintainability improvements
- low-risk progressive disclosure improvements

## Safe autofix policy

Only suggest autofixes when they are deterministic, local, and low-risk.

Reasonable examples:

- fixing clearly broken relative links
- correcting obvious frontmatter formatting issues
- normalizing headings
- moving repeated long-form content into a referenced file when the ownership is unambiguous
- small wording improvements that do not change policy meaning

Do not autofix:

- governance intent
- tool permissions
- shared/project ownership decisions
- security-sensitive logic
- policy semantics
- package boundary design
- major instruction rewrites
- reviewer severity thresholds

## Pull request review procedure

### Step A — Read the change

Identify:

- changed paths
- change purpose
- risk level
- whether protected paths are involved

### Step B — Resolve context

Load:

- base registry governance
- target project overlay
- package rules for changed areas
- cross-cutting rules based on change type

### Step C — Review in order

Apply the review order defined earlier. Do not start with style.

### Step D — Classify findings

Separate findings into:

- blockers
- high-severity findings
- advisories
- safe autofixes

Do not flatten all comments into one severity.

### Step E — Call out uncertainty

If important files, overlays, tests, or diffs are missing, explicitly say so.

## Review output template

Use this structure:

### Overall verdict

One short summary of merge readiness.

### Blockers

List only must-fix issues.

### High-severity findings

List serious but potentially non-blocking issues.

### Advisory findings

List lower-risk suggestions.

### Safe autofix suggestions

List only deterministic, low-risk changes.

### Missing context or uncertainty

List anything that limited review confidence.

## Decision heuristics

When in doubt:

- prefer repository-specific rules over generic best practices
- prefer safety over convenience
- prefer shared ownership clarity over clever reuse
- prefer explicit denial paths over optimistic assumptions
- prefer concrete, verifiable fixes over general advice

## Special rules for agent-generated changes

Apply extra scrutiny to changes generated by autonomous or semi-autonomous agents.

Look for:

- over-broad edits
- hidden coupling
- partial refactors
- missing tests
- changes that read plausible but are not grounded in repo conventions
- permission or automation expansion
- silent weakening of controls

Do not assume an agent-generated change is safe because it is internally consistent.

## Failure handling

If the repository lacks some expected governance files or overlays:

- continue with the review using available evidence
- state what is missing
- reduce confidence where appropriate
- recommend adding the missing governance file if the gap matters

## Review mindset

This skill exists to keep the registry and its governed projects:

- valid
- discoverable
- actionable
- scoped
- safe
- reviewable
- maintainable

A good review should answer:

Is this change structurally valid, context-aware, safe, appropriately scoped, and aligned with the repository’s intended architecture and governance?
