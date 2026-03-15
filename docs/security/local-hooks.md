# Local Git Hooks

This repo uses [pre-commit](https://pre-commit.com/) to run security and quality checks before code leaves your machine.

## Prerequisites

| Tool       | Version | Install                                               |
| ---------- | ------- | ----------------------------------------------------- |
| Node.js    | 22+     | [nodejs.org](https://nodejs.org/)                     |
| pnpm       | 10.6+   | `corepack enable && corepack prepare`                 |
| pre-commit | 4+      | `pip install pre-commit` or `brew install pre-commit` |

> **gitleaks** is installed automatically by pre-commit on first run. No manual install needed.

## Setup

```bash
# Install dependencies
pnpm install

# Install git hooks (both pre-commit and pre-push)
pre-commit install && pre-commit install --hook-type pre-push

# Verify hooks are working
pre-commit run --all-files
```

## Scoping policy

Local hooks enforce a **staged-files-only** policy. This is deliberate.

- Hooks check only what you are committing, not the entire repo.
- If a hook fails on a file you did not change, something is misconfigured — report it, do not bulk-fix unrelated files.
- Never run `prettier --write .` or `eslint --fix .` just to pass a commit. Fix only the files you changed.
- CI is the authoritative full-repo enforcement layer. Local hooks are a fast first pass.

## What runs on commit

These hooks run against **staged files only** and are designed to complete in seconds.

| Hook                    | What it does                                              |
| ----------------------- | --------------------------------------------------------- |
| trailing-whitespace     | Strips trailing whitespace                                |
| end-of-file-fixer       | Ensures files end with a newline                          |
| check-yaml              | Validates YAML syntax                                     |
| check-json              | Validates JSON syntax                                     |
| check-merge-conflict    | Blocks leftover merge conflict markers                    |
| check-added-large-files | Blocks files over 500 KB                                  |
| no-commit-to-branch     | Prevents direct commits to `main` / `master`              |
| detect-private-key      | Scans for private key material                            |
| check-symlinks          | Detects broken symlinks                                   |
| **gitleaks**            | Scans staged content for secrets, tokens, and credentials |
| **prettier**            | Checks formatting (JS/TS/JSON/CSS/MD/YAML)                |
| **eslint**              | Lints TypeScript and JavaScript (zero warnings allowed)   |

## What runs on push

| Hook          | What it does                                      |
| ------------- | ------------------------------------------------- |
| **typecheck** | Runs `tsc --noEmit` across all workspace packages |

Typecheck runs on push because it operates on the full project, not individual files, and takes longer than commit-time hooks.

## What CI still enforces

Local hooks are a first line of defense. CI is the final enforcement layer.

| Check             | Local             | CI                                            |
| ----------------- | ----------------- | --------------------------------------------- |
| Secret scanning   | gitleaks (staged) | gitleaks (full repo) + GitHub secret scanning |
| Lint              | eslint (staged)   | eslint (all files)                            |
| Format            | prettier (staged) | prettier (all files)                          |
| Typecheck         | pre-push          | Full build + typecheck                        |
| Build             | —                 | `pnpm build`                                  |
| Tests             | —                 | Test suite                                    |
| Dependency review | —                 | GitHub dependency review                      |
| SAST              | —                 | CodeQL / Semgrep                              |

## When a hook fails

### gitleaks: secret detected

```
Finding:     AKIA...
Secret:      AWS Access Key
File:        services/orchestrator-api/src/config.ts
```

**Fix:** Remove the secret from source code. Use environment variables or a secrets manager instead.

```bash
# Check what gitleaks found
pnpm exec gitleaks detect --source . --verbose

# If it's a false positive, add an inline comment:
# gitleaks:allow

# Or add a path/rule allowlist entry in .gitleaks.toml
```

### prettier: formatting error

```
Checking formatting...
[warn] apps/web/src/App.tsx
```

**Fix:** Format only the file(s) that failed — not the whole repo.

```bash
pnpm exec prettier --write <file>
```

Do **not** run `prettier --write .` to fix a single file. If multiple unrelated files fail, that indicates a repo-wide formatting issue that should be addressed as a separate task.

### eslint: lint error

```
/apps/web/src/App.tsx
  3:10  error  'foo' is defined but never used
```

**Fix:** Address the lint error in your code. If you're confident it's a false positive, use a targeted disable comment:

```typescript
// eslint-disable-next-line @typescript-eslint/no-unused-vars
```

### typecheck: type error (pre-push)

```
error TS2322: Type 'string' is not assignable to type 'number'.
```

**Fix:** Resolve the type error before pushing. Run locally to see the full output:

```bash
pnpm typecheck
```

## Skipping hooks

Use sparingly and only when you have a good reason.

```bash
# Skip a specific hook
SKIP=eslint git commit -m "wip: draft"

# Skip all pre-commit hooks (not recommended)
git commit --no-verify -m "emergency fix"

# Skip pre-push hooks
git push --no-verify
```

> **Note:** CI will still enforce all checks. Skipping hooks does not bypass CI.

## Updating hooks

```bash
pre-commit autoupdate
```

This updates hook versions in `.pre-commit-config.yaml`. Review the diff and commit the update.

## Troubleshooting

**"pnpm: command not found"** — Ensure Node.js 22+ is installed and run `corepack enable`.

**"pre-commit: command not found"** — Install via `pip install pre-commit` or `brew install pre-commit`.

**Hooks not running** — Run `pre-commit install && pre-commit install --hook-type pre-push` to reinstall.

**Hook takes too long** — Pre-commit runs only on staged files. If a hook is slow, ensure you're not staging large generated files. If typecheck is slow on push, this is expected for the full monorepo build.

**False positive in gitleaks** — Add the pattern to `.gitleaks.toml` allowlist or use an inline `# gitleaks:allow` comment. Do not add secrets to the allowlist.
