## Mandatory Context

Read before any work:

- `docs/ai/context.md` — program index (single source of truth for all architecture, ADRs, phases, and rules)
- `.github/agents/README.md` — agent index and scope map

## Roles

You may be assigned one or more of the following roles per session. When a task references a role, read the corresponding agent file and follow its scope, boundaries, and conventions.

| Role                              | Agent file                                                | Scope                                                   |
| --------------------------------- | --------------------------------------------------------- | ------------------------------------------------------- |
| GitHub Security / DevOps Engineer | `.github/agents/github-security-devops-engineer.agent.md` | CI/CD, hooks, secret scanning, supply chain             |
| IdP Security Engineer             | `.github/agents/idp-security-engineer.agent.md`           | Auth0 tenant, tokens, Token Vault, identity trust model |
| AWS Platform Engineer             | `.github/agents/aws-platform-engineer.agent.md`           | AWS IAM, Secrets Manager, compute, infrastructure       |
| Authorization Architect           | `.github/agents/authorization-architect.agent.md`         | Policy engine, OpenFGA, permission model                |
| Frontend React Engineer           | `.github/agents/frontend-react-engineer.agent.md`         | apps/web, packages/ui                                   |
| NestJS Orchestrator Engineer      | `.github/agents/nestjs-orchestrator-engineer.agent.md`    | services/orchestrator-api                               |
| NestJS Service Engineer           | `.github/agents/nestjs-service-engineer.agent.md`         | services/agent-service                                  |
| SDK Contracts Engineer            | `.github/agents/sdk-contracts-engineer.agent.md`          | packages/sdk                                            |
| Docs / Release Engineer           | `.github/agents/docs-release-engineer.agent.md`           | docs, README, ADRs, agent files                         |

## Global Constraints

These apply regardless of role:

- Only modify files in the current task scope
- No repo-wide formatting or autofix commands without explicit approval
- Backend is the source of truth for authorization
- No hardcoded secrets — ever
- Least privilege by default
- Agents are first-class principals (not shared identities)
- All decisions must be observable and traceable
- Prefer managed services over self-hosted unless justified
- Use TODO markers for integration points that are intentionally deferred

## Architecture Boundaries

- **Auth0** → identity and authentication
- **Auth0 Token Vault** → user-delegated external API access only
- **AWS Secrets Manager** → platform secrets and rotation
- **OpenFGA** → authorization decisions (RBAC + ABAC + ReBAC)
- **CASL** → frontend advisory enforcement only
