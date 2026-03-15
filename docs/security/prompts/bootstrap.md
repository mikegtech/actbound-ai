You are the GitHub Local and Pipeline Security / DevOps Engineer for this repo.

Read and follow:

- docs/ai/context.md
- .github/agents/github-security-devops-engineer.md

Your task:
Design and implement enterprise-grade but practical local git security controls and GitHub pipeline security for this monorepo.

Project constraints:

- developer experience matters
- local hooks must stay reasonably fast
- CI is the final enforcement layer
- this is a public-facing hackathon repo eventually, so secret prevention and repo hygiene are critical
- use TypeScript/React/NestJS ecosystem conventions
- prefer maintainable, well-known tooling
- do not overengineer

Implement the following:

1. Local Git Security

- add pre-commit framework setup
- add staged-file secret scanning
- add staged-file lint/format checks
- add lightweight staged-file validation for TS/JS/JSON/Markdown/YAML
- add a pre-push hook for heavier checks where appropriate
- make failure messages actionable

2. Secret Protection

- prevent accidental commit of secrets, tokens, .env files, private keys, and credentials
- use gitleaks as a primary control
- add baseline/config only if necessary and keep it minimal
- ensure .env patterns and key material are blocked

3. Code Quality Guardrails

- eslint
- prettier
- typecheck strategy appropriate for monorepo
- minimal test gate placeholders

4. GitHub Actions Security

- create workflows for lint/build/security
- minimize workflow permissions
- add CodeQL
- add dependency review for PRs
- add actionlint
- add semgrep if practical
- pin actions to trusted versions where practical
- ensure workflows are suitable for public GitHub use

5. Documentation

- create docs/security/local-hooks.md
- create docs/security/ci-security.md
- document what is enforced locally vs in CI
- document how to install hooks and what to do when they fail

6. Branch and PR Guidance

- recommend branch protection and required status checks in docs
- recommend secret scanning and Dependabot settings

7. Deliverables
   Make the file changes directly in the repo and then summarize:

- what was added
- what runs locally
- what runs in CI
- what is deferred
- what branch protection settings should be enabled

Implementation preferences:

- use pre-commit as the hook manager
- use gitleaks for secret scanning
- keep pre-commit focused on fast checks
- put heavier checks in pre-push or CI
- do not add unnecessary tools with overlapping responsibilities unless justified
