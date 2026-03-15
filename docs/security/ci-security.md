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

## CI checks overview

### Lint and build (existing)

Runs on every push to `main` and every PR. Installs dependencies, runs eslint across all files, and builds all packages.

### Secret scanning (planned)

- **gitleaks** — full-repo scan on every PR, not just staged files
- **GitHub secret scanning** — enabled at the repo level to detect known token patterns in all branches

### Static analysis (planned)

- **CodeQL** — GitHub's SAST engine, runs on PR and on schedule
- **Semgrep** — additional rule-based SAST if practical for the stack

### Dependency review (planned)

- **dependency-review-action** — runs on PRs that modify `package.json` or `pnpm-lock.yaml`, flags known-vulnerable or restricted-license dependencies

### Workflow linting (planned)

- **actionlint** — validates GitHub Actions workflow syntax and best practices

## Scoping policy for CI

CI runs full-repo checks. This is intentional and different from local hooks.

- CI checks all files, not just changed files. This catches drift that local hooks miss.
- CI results are authoritative. If CI passes but a local hook fails (or vice versa), CI is the source of truth for merge eligibility.
- CI must not be skipped. Branch protection rules should require CI checks to pass before merge.

## What CI should never do

- Automatically rewrite or commit formatting fixes back to a branch. Developers fix their own code.
- Run with elevated permissions unless strictly required. Workflows should use least-privilege `permissions` blocks.
- Use unpinned or unreviewed third-party actions. Pin actions to specific commit SHAs or trusted version tags.

## Branch protection recommendations

When CI is established, enable these on `main`:

| Setting                           | Value                             |
| --------------------------------- | --------------------------------- |
| Require pull request reviews      | 1+ approvals                      |
| Require status checks to pass     | lint-build, security (when added) |
| Require branches to be up to date | Yes                               |
| Require signed commits            | Optional (recommended)            |
| Restrict push access              | Maintainers only                  |
| Allow force pushes                | No                                |
| Allow deletions                   | No                                |

## GitHub repo-level settings

| Setting                         | Value                 |
| ------------------------------- | --------------------- |
| Secret scanning                 | Enabled               |
| Push protection                 | Enabled               |
| Dependabot alerts               | Enabled               |
| Dependabot security updates     | Enabled               |
| Private vulnerability reporting | Enabled (when public) |

## Deferred items

These are not yet implemented and are tracked here for visibility:

- [ ] gitleaks CI workflow (full-repo scan)
- [ ] CodeQL workflow
- [ ] dependency-review-action workflow
- [ ] actionlint workflow
- [ ] Semgrep workflow (evaluate fit)
- [ ] Branch protection rules (apply after CI workflows land)
- [ ] Test suite CI gate (when tests exist)
