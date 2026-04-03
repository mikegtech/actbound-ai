# AI Agent Instruction System

This directory contains path-scoped agent profiles that guide AI coding tools (GitHub Copilot, Claude Code, Codex) to follow the repo's architecture, stack boundaries, and security rules.

## How It Works

Each `.agent.md` file defines a role with:

- **Mission** — what the agent owns
- **Scope / applyTo** — which paths the agent is responsible for
- **Prerequisites** — which docs to read before any work
- **Hard boundaries** — rules that must never be violated
- **Do/Don't rules** — practical guidance

All agents reference `docs/ai/context.md` as the program index (single source of truth).

## Agent Index

| Agent                           | File                                       | Scope                                           |
| ------------------------------- | ------------------------------------------ | ----------------------------------------------- |
| Frontend React Engineer         | `frontend-react-engineer.agent.md`         | `apps/web/**`, `packages/ui/**`                 |
| NestJS Orchestrator Engineer    | `nestjs-orchestrator-engineer.agent.md`    | `services/orchestrator-api/**`                  |
| NestJS Service Engineer         | `nestjs-service-engineer.agent.md`         | `services/agent-service/**`                     |
| Authorization Architect         | `authorization-architect.agent.md`         | `packages/authorization/**`                     |
| SDK Contracts Engineer          | `sdk-contracts-engineer.agent.md`          | `packages/sdk/**`                               |
| GitHub Security/DevOps Engineer | `github-security-devops-engineer.agent.md` | `.github/**`, `docs/security/**`                |
| Docs/Release Engineer           | `docs-release-engineer.agent.md`           | `docs/**`, `README.md`, `.github/agents/**`     |
| IdP Security Engineer           | `idp-security-engineer.agent.md`           | Auth0 tenant, Token Vault, identity trust model |
| AWS Platform Engineer           | `aws-platform-engineer.agent.md`           | `infra/**`, AWS IAM, Secrets Manager            |

## Rules

- Agents do not overlap in scope. Each path has at most one owning agent.
- All agents defer to `docs/ai/context.md` for global constraints.
- Agent files are maintained by the Docs/Release Engineer role.
