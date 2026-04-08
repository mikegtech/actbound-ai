# ActBound AI — Canonical Diagram Catalog

Load this file when the user asks for any of the 9 ActBound AI platform
diagrams. Use the `diagramType`, `direction`, and key actors listed here
as the starting point for your `Eraser:generate` call.

---

## Diagram 1 — Platform System Architecture

**Purpose:** Foundation diagram — all components and trust boundaries  
**`diagramType`:** `cloud-architecture-diagram`  
**`direction`:** `right`

Key zones: BROWSER, GATEWAY, INTERNAL SERVICES, DATA STORES, EXTERNAL SERVICES  
Key actors: React SPA, orchestrator-api, sync-service, agent-service,
PostgreSQL, OpenFGA, Redis, Auth0, AWS Secrets Manager, Token Vault  
Critical edges: Trust Boundary (React SPA → orchestrator-api, red/dashed)

---

## Diagram 2 — Identity & Token Flow

**Purpose:** Shows Auth0 PKCE, M2M client_credentials, and Token Vault storage  
**`diagramType`:** `sequence-diagram`  
**`direction`:** `down`

Key actors: Browser, Auth0, orchestrator-api, Token Vault, AWS Secrets Manager  
Sequence highlights:

- Browser → Auth0: PKCE authorization request
- Auth0 → Browser: authorization code
- Browser → orchestrator-api: code exchange
- orchestrator-api → Auth0: M2M client_credentials token request
- Auth0 → orchestrator-api: access + refresh tokens
- orchestrator-api → Token Vault: encrypted token storage (KMS)
- orchestrator-api → Browser: session cookie / JWT

---

## Diagram 3 — Authorization Decision Pipeline

**Purpose:** Core security story — RBAC → ABAC → OpenFGA fail-closed chain  
**`diagramType`:** `flowchart-diagram`  
**`direction`:** `down`

Key nodes: Incoming Request, JWT Validation, RBAC Check (CASL),
ABAC Policy Evaluation, OpenFGA Relationship Check, ALLOW, DENY  
Critical paths:

- Any check failure → immediate DENY (fail-closed)
- All checks pass → ALLOW → route to service
- Show `packages/authorization` (@actbound/authorization) at RBAC node
- Show OpenFGA tuple lookup at relationship check node

---

## Diagram 4 — Agent Delegation & Consent Flow

**Purpose:** Core product story — agent acting on behalf of user with consent  
**`diagramType`:** `sequence-diagram`  
**`direction`:** `down`

Key actors: User, orchestrator-api, Consent Store, agent-service,
OpenFGA, Target Service  
Sequence highlights:

- User → orchestrator-api: delegate action to agent
- orchestrator-api → Consent Store: verify delegation scope
- Consent Store → orchestrator-api: scope granted / denied
- orchestrator-api → agent-service: dispatch with delegation token
- agent-service → OpenFGA: verify agent-has-permission-on-resource
- agent-service → Target Service: execute on behalf of user
- Target Service → agent-service: result
- agent-service → orchestrator-api: result + audit event

---

## Diagram 5 — OpenFGA Principal & Relationship Model

**Purpose:** Data model behind diagram 3 — tuples, principals, objects  
**`diagramType`:** `entity-relationship-diagram`  
**`direction`:** `right`

Key entities: User, Agent, Tenant, Resource, Permission, Role  
Key relationships:

- User `member-of` Tenant
- Agent `acts-on-behalf-of` User
- Agent `has-relation` Resource (via tuple: agent:X#relation@resource:Y)
- User `has-role` Role within Tenant
- Role `grants` Permission on Resource type
- Tenant `owns` Resource

---

## Diagram 6 — Infrastructure Security Topology

**Purpose:** Zero-trust zone boundaries, network segmentation  
**`diagramType`:** `cloud-architecture-diagram`  
**`direction`:** `right`

Key zones: Public Internet, Public Subnet (ALB, orchestrator-api ECS),
Private Subnet (sync-service, agent-service ECS), Data Subnet
(RDS PostgreSQL, Redis, OpenFGA), External (Auth0, AWS Secrets Manager)  
Key controls: Security groups, VPC boundaries, no direct public → data path,
all egress via NAT Gateway

---

## Diagram 7 — Hexagonal Service Architecture

**Purpose:** Reflects current code structure with ResilienceService  
**`diagramType`:** `flowchart-diagram`  
**`direction`:** `right`

Key zones: Inbound Ports (REST controllers, MCP handlers, event consumers),
Domain Core (use cases, domain services, entities),
Outbound Ports (repository interfaces, external service interfaces),
Adapters (Drizzle ORM, Auth0 client, OpenFGA client, Redis client),
Cross-cutting: ResilienceService (platform health aggregation, break-glass seams);
OpenFGA client has its own circuit breaker (5s timeout, 1 retry) per ADR-021

---

## Diagram 8 — Security Observability Event Flow

**Purpose:** Break-glass events, audit trail, SIEM routing  
**`diagramType`:** `sequence-diagram`  
**`direction`:** `down`

Key actors: Service (any), ObservabilityService (in-memory counters + structured
JSON log emission), CloudWatch/Datadog (via Fluent Bit sidecar),
Audit Log (PostgreSQL via AuditWriter), Break-Glass Handler, Alert Channel
(PagerDuty / Slack)  
Key events: `break_glass.invoked`, `break_glass.revoked`,
`secret.boundary.denied`, `authz.openfga.error`,
`dependency.openfga.failure`, `secret.compromise.detected`  
Note: No Redis Streams event bus — ObservabilityService uses direct `obs.emit()`
calls with in-memory counters; structured JSON logs are shipped to CloudWatch
via Fluent Bit

---

## Diagram 9 — Resilience, Break-Glass & Recovery

**Purpose:** Captures latest feature work — state transitions and recovery  
**`diagramType`:** `flowchart-diagram`  
**`direction`:** `down`

Key states: OPERATIONAL, DEGRADED, CRITICAL, BREAK-GLASS-ACTIVE, RECOVERING, RESTORED  
Key transitions:

- OPERATIONAL → DEGRADED: one dependency unhealthy (OpenFGA or database)
- DEGRADED → CRITICAL: both OpenFGA AND database degraded simultaneously
- DEGRADED/CRITICAL → BREAK-GLASS-ACTIVE: `invokeBreakGlass()` called (manual or automated)
- BREAK-GLASS-ACTIVE: elevated access granted, full audit trail via AuditWriter,
  ObservabilityService emits `break_glass.invoked` at `severity: critical`
- BREAK-GLASS-ACTIVE → RECOVERING: `revokeBreakGlass()` called, incident resolved
- RECOVERING → RESTORED: `validateRecoveryStep()` passes for all RECOVERY_ORDER steps
- RESTORED → OPERATIONAL: health checks pass, all dependencies healthy
