# Eraser Diagram Prompting Guide

Load this file when the diagram is complex, multi-zone, or when a first
attempt produced output that didn't match the user's intent.

---

## The Three-Section Structure

Always structure the `text` parameter with these three sections:

### 1. Zones

Describe logical boundaries, swimlanes, or container groups first.
Eraser uses these to set layout regions before placing nodes.

```
Zones:
- BROWSER: React SPA (port 5173)
- GATEWAY: orchestrator-api (port 3001, public gateway)
- INTERNAL SERVICES: sync-service (3003), agent-service
- DATA STORES: PostgreSQL (5432), OpenFGA (8180), Redis (6379)
- EXTERNAL SERVICES: Auth0, AWS Secrets Manager, Token Vault
```

### 2. Components

List each node with its label, color hint, size hint, and any relevant
metadata (ports, tech stack, role).

```
Components:
- React SPA [orange] — browser client
- orchestrator-api [blue, large] — public API gateway
- sync-service [blue] — data sync worker
- agent-service [purple] — LangGraph agent runner
- PostgreSQL, OpenFGA, Redis [teal] — data stores
- Auth0, AWS Secrets Manager, Token Vault [amber] — external services
```

### 3. Connections

List every directional relationship. Include edge labels for important
semantics (trust boundaries, protocol names, auth method).

```
Connections:
- React SPA → orchestrator-api [label: "Trust Boundary"]
- orchestrator-api → sync-service
- orchestrator-api → agent-service
- sync-service → PostgreSQL
- sync-service → OpenFGA
- agent-service → OpenFGA
- orchestrator-api → Auth0
- orchestrator-api → AWS Secrets Manager
- orchestrator-api → Token Vault
```

---

## Complete Prompt Example

```
Create a system architecture diagram titled "ActBound AI – Platform Architecture".

Zones:
- BROWSER: React SPA (port 5173)
- GATEWAY: orchestrator-api :3001 (public gateway)
- INTERNAL SERVICES: sync-service :3003, agent-service
- DATA STORES: PostgreSQL :5432, OpenFGA :8180, Redis :6379
- EXTERNAL SERVICES: Auth0, AWS Secrets Manager, Token Vault

Components:
- React SPA [orange] — browser client, port 5173
- orchestrator-api [blue, large] — public gateway, port 3001
- sync-service [blue] — MLS sync, port 3003
- agent-service [purple] — LangGraph agent runner
- PostgreSQL [teal], OpenFGA [teal], Redis [teal] — data stores
- Auth0 [amber], AWS Secrets Manager [amber], Token Vault [amber]

Connections:
- React SPA → orchestrator-api [Trust Boundary, red]
- orchestrator-api → sync-service
- orchestrator-api → agent-service
- sync-service → PostgreSQL
- sync-service → OpenFGA
- agent-service → OpenFGA
- orchestrator-api → Auth0
- orchestrator-api → AWS Secrets Manager
- orchestrator-api → Token Vault
```

---

## Eraser Prompt Tips

**Be explicit about zone containment.** If a node belongs inside a zone,
say so directly — "sync-service is inside INTERNAL SERVICES zone". Eraser
infers grouping but explicit containment prevents misplacement.

**Use color hints, not hex values.** Say `[blue]`, `[teal]`, `[amber]`,
`[purple]`, `[orange]` — Eraser maps these to its palette per the active
`colorMode`. Hex values are ignored.

**Label only meaningful edges.** Don't label every arrow — label edges
that carry semantic weight: trust boundaries, auth protocols (PKCE, M2M,
client_credentials), failure paths (→ deny, → allow).

**For sequence diagrams**, name actors explicitly and describe each message
in order:

```
Actors: Browser, Auth0, orchestrator-api, Token Vault

Sequence:
1. Browser → Auth0: Authorization Code + PKCE challenge
2. Auth0 → Browser: auth code
3. Browser → orchestrator-api: auth code exchange
4. orchestrator-api → Auth0: code + verifier (M2M)
5. Auth0 → orchestrator-api: access token + refresh token
6. orchestrator-api → Token Vault: store encrypted tokens
7. orchestrator-api → Browser: session established
```

**For ER diagrams**, describe entities and relationships:

```
Entities: User, Agent, Tenant, Resource, Permission
Relationships:
- User belongs-to Tenant (many-to-one)
- Agent acts-on-behalf-of User (many-to-one)
- Agent has-permission-on Resource via Permission tuple
- Tenant owns Resource (one-to-many)
```

---

## When the First Attempt Misses

Use `Eraser:generateEdit` (not a new `generate` call) and be specific about
what changed:

- "Move the Data Stores zone to the right side"
- "Add a Redis node inside the Data Stores zone"
- "Change the connection from agent-service to OpenFGA to show bidirectional"
- "Rename 'orchestrator-api' to 'API Gateway :3001'"
- "Add a dashed red edge from React SPA to orchestrator-api labeled Trust Boundary"

Keep edit prompts focused on one change at a time for best results.
