# CI Security

CI is the authoritative enforcement layer for this repo. Local hooks provide fast developer feedback; CI provides full-repo validation that cannot be skipped or bypassed.

## Relationship to local hooks

| Concern         | Local (pre-commit/pre-push) | CI                                          |
| --------------- | --------------------------- | ------------------------------------------- |
| Scope           | Staged files only           | All files, full repo                        |
| Enforcement     | Advisory — can be skipped   | Mandatory — blocks merge                    |
| Speed           | Must be fast                | Can be thorough                             |
| Secret scanning | gitleaks on staged content  | gitleaks full repo + GitHub secret scanning |
| Lint            | eslint on staged TS/JS      | eslint on all TS/JS                         |
| Format          | prettier on staged files    | prettier --check on all files               |
| Typecheck       | pre-push (full monorepo)    | Full build + typecheck                      |
| Build           | —                           | `pnpm build`                                |
| Tests           | —                           | Full test suite                             |
| SAST            | —                           | CodeQL, Semgrep                             |
| Dependencies    | —                           | dependency-review-action                    |
| Workflow lint   | —                           | actionlint                                  |

## Workflows

### ci.yml — Quality

Runs on every push to `main` and every PR. Single job with sequential steps.

| Step         | Command                         |
| ------------ | ------------------------------- |
| Lint         | `pnpm lint`                     |
| Format check | `prettier --check .`            |
| Typecheck    | `pnpm typecheck`                |
| Build        | `pnpm build`                    |
| Test         | Placeholder (enable when ready) |

Permissions: `contents: read`

### security.yml — Security Scanning

Runs on every push to `main` and every PR. Three parallel jobs.

| Job        | Tool                              | What it does                           |
| ---------- | --------------------------------- | -------------------------------------- |
| gitleaks   | gitleaks-action v2                | Full-repo secret scan (all history)    |
| actionlint | actionlint 1.7.7                  | Validates workflow YAML best practices |
| semgrep    | semgrep (p/default, p/javascript) | Rule-based SAST for JS/TS              |

Permissions: `contents: read`

### codeql.yml — CodeQL Analysis

Runs on push to `main`, PRs, and weekly (Monday 06:00 UTC).

- Language: `javascript-typescript`
- Uses GitHub's CodeQL engine for deep semantic SAST
- Results appear in the Security tab

Permissions: `actions: read`, `contents: read`, `security-events: write`

### dependency-review.yml — Dependency Review

Runs on PRs only.

- Flags new dependencies with known high-severity vulnerabilities
- Posts a summary comment on the PR
- Blocks merge on high-severity findings

Permissions: `contents: read`, `pull-requests: write`

## Scoping policy for CI

CI runs full-repo checks. This is intentional and different from local hooks.

- CI checks all files, not just changed files. This catches drift that local hooks miss.
- CI results are authoritative. If CI passes but a local hook fails (or vice versa), CI is the source of truth for merge eligibility.
- CI must not be skipped. Branch protection rules should require CI checks to pass before merge.

## What CI should never do

- Automatically rewrite or commit formatting fixes back to a branch. Developers fix their own code.
- Run with elevated permissions unless strictly required. Workflows should use least-privilege `permissions` blocks.
- Use unpinned or unreviewed third-party actions. Pin actions to specific commit SHAs or trusted version tags.

## Required status checks

Enable these as required checks in branch protection for `main`:

| Check name        | Workflow              | Required  |
| ----------------- | --------------------- | --------- |
| Quality           | ci.yml                | Yes       |
| Secret Scanning   | security.yml          | Yes       |
| Workflow Linting  | security.yml          | Yes       |
| Semgrep SAST      | security.yml          | Yes       |
| CodeQL Analysis   | codeql.yml            | Yes       |
| Dependency Review | dependency-review.yml | Yes (PRs) |

## Branch protection recommendations

Enable these on `main`:

| Setting                           | Value                                                                     |
| --------------------------------- | ------------------------------------------------------------------------- |
| Require pull request reviews      | 1+ approvals                                                              |
| Require status checks to pass     | Quality, Secret Scanning, Workflow Linting, Semgrep SAST, CodeQL Analysis |
| Require branches to be up to date | Yes                                                                       |
| Require signed commits            | Optional (recommended)                                                    |
| Restrict push access              | Maintainers only                                                          |
| Allow force pushes                | No                                                                        |
| Allow deletions                   | No                                                                        |

## GitHub repo-level settings

| Setting                         | Value                 |
| ------------------------------- | --------------------- |
| Secret scanning                 | Enabled               |
| Push protection                 | Enabled               |
| Dependabot alerts               | Enabled               |
| Dependabot security updates     | Enabled               |
| Private vulnerability reporting | Enabled (when public) |

## Deferred items

- [ ] Test suite CI gate (enable `pnpm test` step when tests exist)
- [ ] Branch protection rules (apply after first successful CI run)
- [ ] SARIF upload for semgrep (if GitHub Security tab integration is desired)
