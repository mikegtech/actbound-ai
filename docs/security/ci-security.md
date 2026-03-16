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

The repo also includes `.github/CODEOWNERS` and `.env.example` as tracked hygiene files for public-repo readiness and safe local setup.

## Branch strategy

Workflows use a `push` + `pull_request` trigger model.

**Push triggers** run on:

- `main` — the integration/release branch
- `feat/**` — active feature branches (e.g. `feat/actbound-foundation`)

**Pull request triggers** run on PRs targeting any branch (no branch filter). This ensures PRs into `main` or into feature branches are always validated.

**Dependency review** is PR-only — it compares the PR diff against the base, so a push trigger is not applicable.

**CodeQL schedule** runs weekly on the repo's default branch only (GitHub Actions behavior for `schedule`).

| Workflow              | push (`main`, `feat/**`) | pull_request (any target) | schedule |
| --------------------- | ------------------------ | ------------------------- | -------- |
| ci.yml                | Yes                      | Yes                       | —        |
| security.yml          | Yes                      | Yes                       | —        |
| codeql.yml            | Yes                      | Yes                       | Weekly   |
| dependency-review.yml | —                        | Yes                       | —        |

If the branch naming convention changes, update the `push.branches` list in each workflow.

## Workflows

### ci.yml — Quality

Runs on push to `main` and `feat/**`, and on every PR. Single job with sequential steps.

| Step         | Command                         |
| ------------ | ------------------------------- |
| Lint         | `pnpm lint`                     |
| Format check | `prettier --check .`            |
| Typecheck    | `pnpm typecheck`                |
| Build        | `pnpm build`                    |
| Test         | Placeholder (enable when ready) |

Permissions: `contents: read`

### security.yml — Security Scanning

Runs on push to `main` and `feat/**`, and on every PR. Three parallel jobs.

| Job        | Tool                              | What it does                           | Pinning                          |
| ---------- | --------------------------------- | -------------------------------------- | -------------------------------- |
| gitleaks   | gitleaks-action                   | Full-repo secret scan (all history)    | SHA-pinned (`ff98106...`, v2)    |
| actionlint | actionlint 1.7.7                  | Validates workflow YAML best practices | Script URL pinned to release SHA |
| semgrep    | semgrep (p/default, p/javascript) | Rule-based SAST for JS/TS              | Image pinned to `1.155.0`        |

Permissions: `contents: read`

### codeql.yml — CodeQL Analysis

Runs on push to `main` and `feat/**`, PRs, and weekly (Monday 06:00 UTC).

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

## Supply-chain controls

- **Third-party actions** (`gitleaks/gitleaks-action`, `pnpm/action-setup`) are pinned to full commit SHAs with a version comment. Update SHAs when upgrading.
- **GitHub-owned actions** (`actions/checkout`, `actions/setup-node`, `github/codeql-action`, `actions/dependency-review-action`) use version tags (`@v4`, `@v3`). This is an acceptable tradeoff: GitHub-owned actions have strong provenance guarantees, and SHA-pinning them creates high maintenance burden with minimal security gain.
- **Container images** (`semgrep/semgrep`) are pinned to a versioned tag. Update periodically.
- **External scripts** (actionlint installer) are fetched from a SHA-pinned URL with fail-closed `curl` options over HTTPS/TLS, not from `main`.
- **All checkout steps** set `persist-credentials: false` to avoid leaking tokens to subsequent steps.
- **Tracked hygiene files**: `.github/CODEOWNERS` protects sensitive paths, and `.env.example` provides a non-secret local configuration template.

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

## Post-deploy checklist (manual GitHub settings)

After the first successful CI run, apply these settings in the GitHub UI.

### Branch protection (`main`)

- [ ] Require pull request reviews (1+ approvals)
- [ ] Require status checks to pass: Quality, Secret Scanning, Workflow Linting, Semgrep SAST, CodeQL Analysis
- [ ] Require branches to be up to date before merging
- [ ] Restrict push access to maintainers only
- [ ] Block force pushes
- [ ] Block branch deletions
- [ ] Optional: require signed commits

### Code security (Settings > Code security and analysis)

- [ ] Enable secret scanning
- [ ] Enable push protection
- [ ] Enable Dependabot alerts
- [ ] Enable Dependabot security updates
- [ ] Enable private vulnerability reporting (when repo is public)

### CODEOWNERS

- [ ] Verify `.github/CODEOWNERS` owners match the team structure
- [ ] Enable "Require review from Code Owners" in branch protection

### Environment template

- [ ] Keep `.env.example` aligned with the actual local env surface for `apps/web` and both Nest services

## Test suite and coverage

Tests run in CI as part of the Quality job (`pnpm test:coverage`). Coverage reports are uploaded as artifacts.

Current thresholds (in `vitest.shared.ts`):

| Metric     | Threshold |
| ---------- | --------- |
| Lines      | 10%       |
| Functions  | 10%       |
| Branches   | 5%        |
| Statements | 10%       |

These are intentionally low starter thresholds. Raise them as coverage improves — the thresholds should ratchet up, never down. Update `vitest.shared.ts` and re-verify with `pnpm test:coverage`.

Recommended next thresholds (when more tests are added):

| Metric     | Target |
| ---------- | ------ |
| Lines      | 40%    |
| Functions  | 40%    |
| Branches   | 30%    |
| Statements | 40%    |

## Deferred items

- [ ] SARIF upload for semgrep (if GitHub Security tab aggregation is desired)
- [ ] Raise coverage thresholds as test coverage improves
- [ ] Fix token broker schema wrapping (permissionDecision needs `toPermissionDecisionRecord` in preview/retrieve flows)
