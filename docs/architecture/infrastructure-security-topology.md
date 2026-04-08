# Infrastructure Security Topology

## Overview

This document defines the complete infrastructure topology, network design, environment isolation, and trust boundaries for the ActBound AI platform. It covers AWS, VPS, Tailscale, and the home network boundary.

**Operating model:** Small team. Managed AWS services where practical. Explicit trust boundaries. Low blast radius per failure domain.

---

## 1. Infrastructure Security Topology Overview

### 1.1 Trust Zones

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ZONE 1: PUBLIC INTERNET                          │
│  Users (browsers), Auth0, third-party APIs, webhooks               │
├─────────────────────────────────────────────────────────────────────┤
│                    ZONE 2: AWS PUBLIC EDGE                          │
│  ALB (HTTPS termination), API Gateway (if used)                    │
│  Only orchestrator-api exposed here                                │
├─────────────────────────────────────────────────────────────────────┤
│                    ZONE 3: AWS PRIVATE                              │
│  agent-service, OpenFGA, Redis, databases                          │
│  No public ingress. Reachable only from Zone 2 or Tailscale.      │
├─────────────────────────────────────────────────────────────────────┤
│                    ZONE 4: TAILSCALE MESH                           │
│  Admin access, VPS connectivity, emergency break-glass             │
│  Overlay network. Not a dependency for production runtime.         │
├─────────────────────────────────────────────────────────────────────┤
│                    ZONE 5: VPS                                      │
│  Build runners, dev tools, monitoring dashboards                   │
│  Semi-trusted. Not production workload host.                       │
├─────────────────────────────────────────────────────────────────────┤
│                    ZONE 6: HOME NETWORK                             │
│  Dev machines, UniFi infrastructure                                │
│  Untrusted for production. Admin access via Tailscale only.        │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Traffic Flows

| Flow                             | Path                                    | Trust mechanism                        |
| -------------------------------- | --------------------------------------- | -------------------------------------- |
| User → orchestrator-api          | Internet → ALB → private subnet         | HTTPS + Auth0 JWT                      |
| orchestrator-api → agent-service | Private subnet → private subnet         | M2M JWT + security group               |
| Any service → OpenFGA            | Private subnet → private subnet         | Security group + gRPC                  |
| Any service → Redis/DB           | Private subnet → private subnet         | Security group + Secrets Manager creds |
| Any service → Secrets Manager    | Private subnet → AWS API (VPC endpoint) | IAM role                               |
| Any service → Auth0              | Private subnet → NAT → Internet         | HTTPS outbound                         |
| Any service → Token Vault        | Private subnet → NAT → Auth0 API        | M2M JWT + HTTPS                        |
| Admin → any private resource     | Home/VPS → Tailscale → private subnet   | Tailscale ACL + MFA                    |
| VPS → AWS resources              | Tailscale → private subnet              | Tailscale ACL + scoped access          |

---

## 2. Environment Isolation Model

### 2.1 Decision: Single AWS Account with VPC-Level Isolation

For a small team, multi-account AWS is premature overhead. Use a single AWS account with separate VPCs per environment.

| Environment | VPC                    | Secrets Manager prefix | OpenFGA instance        | Database   |
| ----------- | ---------------------- | ---------------------- | ----------------------- | ---------- |
| dev         | `actbound-dev-vpc`     | `actbound/dev/*`       | Shared dev instance     | Dev DB     |
| staging     | `actbound-staging-vpc` | `actbound/staging/*`   | Shared staging instance | Staging DB |
| prod        | `actbound-prod-vpc`    | `actbound/prod/*`      | Dedicated prod instance | Prod DB    |

### 2.2 Isolation Boundaries

| Boundary      | Mechanism                                                                  |
| ------------- | -------------------------------------------------------------------------- |
| Network       | Separate VPCs, no VPC peering between environments                         |
| Secrets       | Secrets Manager path prefix + IAM policies scoped per-env                  |
| Authorization | Separate OpenFGA stores per environment                                    |
| Data          | Separate database instances per environment                                |
| Compute       | Separate ECS clusters/services per environment                             |
| IAM           | Role names include environment segment (`actbound-orchestrator-prod-role`) |

### 2.3 Blast Radius

A compromise in `dev` cannot reach `staging` or `prod` because:

- No VPC peering between environments
- IAM roles are scoped to environment-specific Secrets Manager paths
- OpenFGA stores are separate
- Database instances are separate
- Security groups reference environment-specific CIDR ranges

### 2.4 When to Move to Multi-Account

Move to AWS Organizations with per-environment accounts when:

- The team grows beyond 5 engineers
- Compliance requires account-level isolation
- Cost allocation requires per-environment billing boundaries

---

## 3. AWS Network Design

### 3.1 VPC Layout (per environment)

```
actbound-{env}-vpc  (10.{env_id}.0.0/16)
│
├── Public Subnets (10.{env_id}.1.0/24, 10.{env_id}.2.0/24)
│   └── ALB (HTTPS termination for orchestrator-api)
│   └── NAT Gateway (outbound internet for private subnets)
│
├── Private App Subnets (10.{env_id}.10.0/24, 10.{env_id}.11.0/24)
│   └── orchestrator-api (ECS Fargate)
│   └── agent-service (ECS Fargate)
│   └── OpenFGA (ECS Fargate or managed)
│
├── Private Data Subnets (10.{env_id}.20.0/24, 10.{env_id}.21.0/24)
│   └── RDS (Postgres)
│   └── ElastiCache (Redis)
│
└── VPC Endpoints
    └── secretsmanager (interface endpoint)
    └── ecr.api + ecr.dkr (for container image pulls)
    └── logs (for CloudWatch)
    └── s3 (gateway endpoint, for ECR layers)
```

Environment ID mapping: dev=10, staging=20, prod=30.

### 3.2 Subnet Strategy

| Subnet type  | CIDR example (prod)          | Purpose           | Internet access  |
| ------------ | ---------------------------- | ----------------- | ---------------- |
| Public       | 10.30.1.0/24, 10.30.2.0/24   | ALB, NAT Gateway  | Direct           |
| Private App  | 10.30.10.0/24, 10.30.11.0/24 | Services, OpenFGA | Outbound via NAT |
| Private Data | 10.30.20.0/24, 10.30.21.0/24 | RDS, Redis        | None             |

Two subnets per type for multi-AZ redundancy.

### 3.3 Security Groups

| Resource         | Inbound from                 | Outbound to                                   |
| ---------------- | ---------------------------- | --------------------------------------------- |
| ALB              | Internet (443)               | App subnets (service ports)                   |
| orchestrator-api | ALB (3001)                   | agent-service, OpenFGA, Redis, NAT (outbound) |
| agent-service    | orchestrator-api (3002)      | OpenFGA, Redis, NAT (outbound)                |
| OpenFGA          | App subnets (8080/8081)      | Data subnets (if using backing DB)            |
| RDS              | App subnets + OpenFGA (5432) | None                                          |
| Redis            | App subnets (6379)           | None                                          |

### 3.4 VPC Endpoints

VPC endpoints eliminate the need for NAT Gateway for AWS API calls, reducing cost and removing internet dependency for secrets retrieval.

| Endpoint              | Type      | Why                               |
| --------------------- | --------- | --------------------------------- |
| `secretsmanager`      | Interface | Secret retrieval stays in VPC     |
| `ecr.api` + `ecr.dkr` | Interface | Container image pulls stay in VPC |
| `logs`                | Interface | CloudWatch logs stay in VPC       |
| `s3`                  | Gateway   | ECR image layers, cost-free       |

### 3.5 NAT Gateway

One NAT Gateway per environment in a public subnet. Used for:

- Auth0 API calls (token validation JWKS, Token Vault, Management API)
- Third-party API calls (Google, Slack, etc.)
- OpenFGA → Auth0 webhook delivery (if configured)

NOT used for: Secrets Manager, ECR, CloudWatch (VPC endpoints handle these).

### 3.6 Service Placement

| Service          | Subnet       | Compute     | Public       | Notes                               |
| ---------------- | ------------ | ----------- | ------------ | ----------------------------------- |
| orchestrator-api | Private App  | ECS Fargate | Via ALB only | Only public-facing service          |
| agent-service    | Private App  | ECS Fargate | No           | Internal only                       |
| OpenFGA          | Private App  | ECS Fargate | No           | Internal only                       |
| RDS (Postgres)   | Private Data | RDS         | No           | Multi-AZ in prod                    |
| Redis            | Private Data | ElastiCache | No           | Single node in dev, cluster in prod |
| ALB              | Public       | Managed     | Yes          | HTTPS termination, WAF optional     |

---

## 4. VPS Hosting Strategy

### 4.1 VPS Role: Admin Utility and Dev Tooling

The VPS is NOT a production workload host. It is an admin utility and development support system.

| Should run on VPS                                | Should NOT run on VPS            |
| ------------------------------------------------ | -------------------------------- |
| CI/CD build runners (GitHub Actions self-hosted) | Production API services          |
| Monitoring dashboards (Grafana)                  | Production databases             |
| Dev/staging tooling                              | OpenFGA (production)             |
| Ad-hoc admin scripts                             | Secrets Manager access (runtime) |
| Tailscale exit node (if needed)                  | Agent execution                  |

### 4.2 Trust Boundary

The VPS is semi-trusted:

- Connected to Tailscale mesh (can reach private resources via ACL)
- Hardened with SSH key-only access, no password auth
- Runs non-critical workloads only
- A VPS compromise should not compromise production data or secrets

### 4.3 Hardening Requirements

| Control                       | Required                         |
| ----------------------------- | -------------------------------- |
| SSH key-only authentication   | Yes                              |
| Fail2ban or equivalent        | Yes                              |
| Automatic security updates    | Yes                              |
| Firewall (UFW/iptables)       | Yes — allow SSH + Tailscale only |
| No production IAM credentials | Yes — admin tooling only         |
| Disk encryption               | Recommended                      |

---

## 5. Tailscale Connectivity Model

### 5.1 What Goes Through Tailscale

| Use case                              | Tailscale | Why                                         |
| ------------------------------------- | --------- | ------------------------------------------- |
| Admin SSH to VPS                      | Yes       | Private access, no public SSH port          |
| Admin access to AWS private resources | Yes       | Direct to private subnets via subnet router |
| Dev machine → dev environment         | Yes       | Local development against remote services   |
| VPS → monitoring endpoints            | Yes       | Dashboards accessing private services       |
| Emergency break-glass access          | Yes       | Last-resort direct access during outage     |

### 5.2 What Does NOT Go Through Tailscale

| Use case                                     | Why                                                                    |
| -------------------------------------------- | ---------------------------------------------------------------------- |
| User → orchestrator-api (production traffic) | Public ALB handles this. Tailscale is not in the production data path. |
| Service → service (within AWS VPC)           | AWS security groups handle this. No Tailscale dependency for runtime.  |
| Service → Secrets Manager                    | VPC endpoint. No Tailscale.                                            |
| CI/CD → AWS deployment                       | IAM role via OIDC federation. No Tailscale.                            |

### 5.3 Tailscale ACLs

```json
{
  "acls": [
    {
      "action": "accept",
      "src": ["tag:admin"],
      "dst": ["tag:aws-dev:*", "tag:aws-staging:*", "tag:vps:*"]
    },
    {
      "action": "accept",
      "src": ["tag:admin"],
      "dst": ["tag:aws-prod:*"],
      "comment": "Prod access — break-glass only, audited"
    },
    {
      "action": "accept",
      "src": ["tag:vps"],
      "dst": ["tag:aws-dev:*", "tag:aws-staging:*"]
    }
  ]
}
```

### 5.4 Subnet Router

An ECS task or small EC2 instance in each VPC runs the Tailscale subnet router, advertising the VPC CIDR to the Tailscale mesh. This allows admin devices to reach private subnets without VPN infrastructure.

**Production access via Tailscale is break-glass only.** Normal operations use CI/CD pipelines and AWS Console (with MFA).

---

## 6. Ingress and Egress Control Model

### 6.1 Allowed Ingress

| Source            | Destination            | Port    | Auth                | Notes                 |
| ----------------- | ---------------------- | ------- | ------------------- | --------------------- |
| Internet (users)  | ALB → orchestrator-api | 443     | Auth0 JWT           | Only public endpoint  |
| Auth0 (callbacks) | ALB → orchestrator-api | 443     | HTTPS               | Login redirects       |
| Auth0 (webhooks)  | ALB → orchestrator-api | 443     | Webhook signature   | IdP lifecycle events  |
| GitHub (webhooks) | ALB → orchestrator-api | 443     | Webhook signature   | CI/CD triggers        |
| Tailscale (admin) | Private subnets        | Various | Tailscale ACL + MFA | Admin/operator access |

### 6.2 Denied Ingress

- No direct SSH to any AWS instance from the internet
- No public access to agent-service, OpenFGA, Redis, or RDS
- No public access to monitoring dashboards

### 6.3 Allowed Egress

| Source              | Destination                            | Why                                         |
| ------------------- | -------------------------------------- | ------------------------------------------- |
| Private App subnets | Auth0 APIs                             | JWT validation, Token Vault, Management API |
| Private App subnets | Third-party APIs (Google, Slack, etc.) | Delegated external actions                  |
| Private App subnets | AWS APIs (via VPC endpoints)           | Secrets Manager, ECR, CloudWatch            |
| VPS                 | Auth0, GitHub, package registries      | Build and admin tooling                     |

### 6.4 Restricted Egress

Consider adding VPC-level outbound restrictions (via NAT + security group rules) to limit egress to known destinations. This prevents data exfiltration if a service is compromised. At minimum, monitor egress with VPC Flow Logs.

---

## 7. Identity-Aware Infrastructure Boundaries

### 7.1 IAM Role Boundaries

| Service            | IAM Role                            | Can access                                      |
| ------------------ | ----------------------------------- | ----------------------------------------------- |
| orchestrator-api   | `actbound-orchestrator-{env}-role`  | Secrets Manager (own + shared), ECR, CloudWatch |
| agent-service      | `actbound-agent-service-{env}-role` | Secrets Manager (own + shared), ECR, CloudWatch |
| Rotation Lambda    | `actbound-rotation-{env}-role`      | Secrets Manager (write for rotation)            |
| ECS task execution | `actbound-ecs-execution-{env}-role` | ECR pull, CloudWatch logs                       |
| Agent instances    | No IAM role                         | Access brokered through services                |

### 7.2 OpenFGA Network Boundary

OpenFGA runs in private app subnets. Only orchestrator-api and agent-service security groups can reach it. No public access. No direct admin access except via Tailscale (break-glass).

### 7.3 Secrets Manager Access

All Secrets Manager access goes through VPC endpoints — never over the internet. IAM policies scope each service to its own secret paths plus shared paths. The VPC endpoint policy can further restrict which secrets are accessible from which VPC.

---

## 8. UniFi Home Network Boundary Model

### 8.1 Trust Level: Untrusted for Production

The home network is convenient for development but must never be a production trust anchor.

| Property                      | Value                                            |
| ----------------------------- | ------------------------------------------------ |
| Trust level                   | Untrusted for production                         |
| Production traffic dependency | None                                             |
| Admin access mechanism        | Tailscale only (not direct home network routing) |
| Dev environment access        | Via Tailscale to AWS dev VPC                     |
| Credential storage            | Dev machines only, never the router/AP           |

### 8.2 What Should Never Depend on Home Network

- Production service availability
- Secret retrieval or rotation
- Authorization system reachability
- Backup or recovery processes
- CI/CD pipeline execution

### 8.3 How Home Network Admin Access Works

```
Dev machine (home) → Tailscale client → Tailscale mesh → Subnet router (VPC) → Private resources
```

The home network provides internet connectivity to reach Tailscale's coordination server. All actual resource access goes through the encrypted Tailscale tunnel, not through the home network directly.

### 8.4 UniFi Segmentation (Recommended)

| VLAN       | Purpose       | Tailscale access       |
| ---------- | ------------- | ---------------------- |
| Management | UniFi devices | No                     |
| Dev/Work   | Dev machines  | Yes (Tailscale client) |
| IoT        | Smart devices | No                     |
| Guest      | Guest devices | No                     |

Dev machines on the Dev/Work VLAN run Tailscale and can reach cloud infrastructure. No other VLAN has cloud access.

---

## 9. Backup and Recovery Boundary Design

### 9.1 What Is Backed Up

| Resource             | Backup method                             | Frequency                 | Encryption              | Retention    |
| -------------------- | ----------------------------------------- | ------------------------- | ----------------------- | ------------ |
| RDS databases        | Automated snapshots                       | Daily + continuous (PITR) | AWS KMS                 | 30 days      |
| OpenFGA store        | Application-level export                  | Daily                     | Encrypted at rest       | 30 days      |
| Secrets Manager      | Versioned (built-in)                      | Every rotation            | AWS KMS                 | All versions |
| Auth0 configuration  | Terraform state / Auth0 Deploy CLI export | On change                 | Encrypted state backend | Versioned    |
| ECS task definitions | Terraform / CloudFormation                | On change                 | N/A (infra-as-code)     | Git history  |

### 9.2 What Is NOT Backed Up

- Redis cache (ephemeral by design)
- Token broker cache (ephemeral)
- VPC Flow Logs (stored in CloudWatch, retention policy separate)
- Container images (stored in ECR, immutable tags)

### 9.3 Recovery Trust Boundaries

| Action                          | Required access           | Who can do it        |
| ------------------------------- | ------------------------- | -------------------- |
| Restore RDS from snapshot       | RDS admin IAM permissions | Admin (MFA required) |
| Restore OpenFGA from export     | OpenFGA admin access      | Admin (MFA required) |
| Restore Secrets Manager version | Secrets Manager admin IAM | Admin (MFA required) |
| Restore Auth0 configuration     | Auth0 tenant admin        | Admin (MFA required) |

Backup access is separated from runtime access. Runtime IAM roles cannot restore or modify backups. Admin roles with MFA are required.

### 9.4 Cross-Environment Isolation

Backups for each environment are stored in environment-scoped resources. A dev backup cannot be restored to prod (different IAM boundaries, different KMS keys if using per-env keys).

---

## 10. Failure and Isolation Scenarios

### 10.1 VPS Compromise

| Impact                                     | Containment                                                                 |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| Attacker gains VPS shell                   | Tailscale ACLs limit reachability. VPS has no production IAM credentials.   |
| Attacker reaches dev/staging via Tailscale | Dev/staging data is non-production. Rotate VPS Tailscale key immediately.   |
| Attacker attempts prod access              | Tailscale ACL restricts VPS to dev/staging only. Prod requires `tag:admin`. |

**Response:** Revoke VPS Tailscale node. Re-provision VPS. Audit Tailscale access logs.

### 10.2 Home Network Compromise

| Impact                              | Containment                                                          |
| ----------------------------------- | -------------------------------------------------------------------- |
| Home router compromised             | No production dependency. Tailscale tunnel is encrypted end-to-end.  |
| Dev machine compromised             | Revoke Tailscale device. Rotate any dev-only credentials.            |
| Attacker intercepts network traffic | Tailscale WireGuard encryption. HTTPS for all non-Tailscale traffic. |

**Response:** Revoke compromised Tailscale devices. Rotate dev credentials. Home network compromise does not affect production.

### 10.3 Tailscale Outage

| Impact                               | Containment                                       |
| ------------------------------------ | ------------------------------------------------- |
| Admin cannot reach private resources | Use AWS Console (web) with MFA as fallback.       |
| VPS cannot reach monitoring targets  | Monitoring continues via CloudWatch (AWS-native). |
| Production traffic affected?         | No. Production does not depend on Tailscale.      |

**Response:** Wait for Tailscale recovery. Use AWS Console for urgent admin tasks.

### 10.4 Public Ingress Misconfiguration

| Impact                               | Containment                                                         |
| ------------------------------------ | ------------------------------------------------------------------- |
| ALB security group too broad         | Only orchestrator-api is behind ALB. Agent-service has no ALB.      |
| Internal service accidentally public | Security group reviews. No public subnets for app/data services.    |
| WAF bypass                           | Defense-in-depth: JWT validation, authorization checks still apply. |

**Response:** Fix security group. Audit access logs. Rotate any exposed credentials.

### 10.5 Excessive East-West Access

| Impact                                   | Containment                                                 |
| ---------------------------------------- | ----------------------------------------------------------- |
| Service A can reach Service B's database | Security groups restrict DB access to specific service SGs. |
| OpenFGA accessible from data subnets     | SG restricts OpenFGA to app subnet SGs only.                |

**Response:** Audit and tighten security groups. Each service should only reach its declared dependencies.

### 10.6 Environment Crossover

| Impact                             | Containment                                                             |
| ---------------------------------- | ----------------------------------------------------------------------- |
| Dev IAM role accesses prod secrets | IAM policies scoped to `actbound/dev/*`. Cannot read `actbound/prod/*`. |
| Dev VPC peered to prod VPC         | No VPC peering between environments. Physically impossible.             |

**Response:** IAM policy audit. VPC configuration review.

---

## 11. Reusable Skills

### 11.1 `skill.aws.design.vpc-isolation`

**Purpose:** Design a VPC with public/private subnet separation, security groups, and VPC endpoints.

**Inputs:** Environment name, CIDR range, list of services and their tier (public/app/data).

**Outputs:** VPC definition with subnets, route tables, security groups, VPC endpoints.

**Steps:** Assign CIDR → create subnet tiers (public, app, data) → configure route tables (public: IGW, app: NAT, data: none) → create security groups per service → add VPC endpoints for AWS APIs.

### 11.2 `skill.aws.secure.egress-pattern`

**Purpose:** Configure controlled outbound access from private subnets.

**Inputs:** List of required outbound destinations, VPC configuration.

**Outputs:** NAT Gateway config, security group outbound rules, VPC endpoint list.

**Steps:** Identify AWS API destinations → create VPC endpoints → identify external destinations → configure NAT → restrict security group outbound to known ports/destinations → enable VPC Flow Logs.

### 11.3 `skill.tailscale.design.private-admin-access`

**Purpose:** Configure Tailscale for secure admin access to private AWS resources.

**Inputs:** VPC CIDRs, admin user/device list, environment trust levels.

**Outputs:** Tailscale ACL policy, subnet router configuration, device tagging scheme.

**Steps:** Tag devices (admin, vps, aws-dev, aws-staging, aws-prod) → define ACL rules → deploy subnet router in each VPC → restrict prod access to break-glass.

### 11.4 `skill.vps.define.trust-boundary`

**Purpose:** Define what a VPS can and cannot access in the platform.

**Inputs:** VPS role (admin utility, build runner, etc.), connected environments.

**Outputs:** Allowed/denied access matrix, hardening checklist, Tailscale ACL entries.

**Steps:** Define VPS role → identify required access → create Tailscale ACL entries → deny everything else → apply hardening checklist → document boundary.

### 11.5 `skill.infra.segment.environment`

**Purpose:** Create isolated environment segments within a single AWS account.

**Inputs:** Environment name, required services, secret paths.

**Outputs:** VPC, IAM roles, Secrets Manager paths, OpenFGA store config.

**Steps:** Create VPC with environment CIDR → create IAM roles with environment-scoped policies → create Secrets Manager secrets under `actbound/{env}/*` → provision OpenFGA store → verify no cross-env access paths.

---

## Related ADRs

- [ADR-027: Environment Isolation Strategy](../decisions/ADR-027-environment-isolation-strategy.md)
- [ADR-028: VPS Role in Platform Architecture](../decisions/ADR-028-vps-role.md)
- [ADR-029: Tailscale Private Access Model](../decisions/ADR-029-tailscale-private-access.md)
- [ADR-030: Public vs Private Service Exposure Policy](../decisions/ADR-030-service-exposure-policy.md)
- [ADR-031: Home Network Trust Boundary](../decisions/ADR-031-home-network-trust-boundary.md)
