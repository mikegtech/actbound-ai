# Security Resilience and Recovery Architecture

## Overview

This document defines how the platform behaves under failure, compromise, and disaster. It covers backup, recovery, incident response, and containment for every critical system.

**Principle:** Fail closed, recover in order, audit everything — even during incidents. Recovery is not exempt from security controls.

---

## 1. Resilience Architecture Overview

### 1.1 Failure Domains

| Domain         | Components                                    | Blast radius if compromised                                                                       |
| -------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Identity       | Auth0, JWT validation, user/agent credentials | All authentication fails. Services reject requests.                                               |
| Secrets        | AWS Secrets Manager, KMS                      | Services cannot retrieve credentials. DB/Redis unreachable.                                       |
| Authorization  | OpenFGA                                       | Fine-grained checks fail. Fail-closed → all resource-level requests denied. RBAC/ABAC still work. |
| Application    | orchestrator-api, agent-service, domain data  | Feature-specific outage. Other services unaffected.                                               |
| Infrastructure | VPC, ECS, ALB, NAT, Tailscale                 | Compute or network unavailable.                                                                   |
| Agent runtime  | Agent instances, delegated workflows          | Agent actions stop. User-initiated work unaffected.                                               |

### 1.2 Containment Zones

```
┌──────────────────────────────────────────────────────────┐
│ ZONE A: Identity (Auth0)                                 │
│ Self-contained. Managed by Auth0. Platform consumes.     │
│ Recovery: Auth0 SLA + local config backup.               │
├──────────────────────────────────────────────────────────┤
│ ZONE B: Secrets (AWS Secrets Manager + KMS)              │
│ Self-contained within AWS. IAM-scoped per service.       │
│ Recovery: Version rollback + rotation.                   │
├──────────────────────────────────────────────────────────┤
│ ZONE C: Authorization (OpenFGA)                          │
│ Private subnet, backed by Postgres.                      │
│ Recovery: Tuple export restore + model redeploy.         │
├──────────────────────────────────────────────────────────┤
│ ZONE D: Application (services + data)                    │
│ Per-service isolation. ECS Fargate. RDS + Redis.         │
│ Recovery: Redeploy + RDS restore.                        │
├──────────────────────────────────────────────────────────┤
│ ZONE E: Agent Runtime                                    │
│ Per-instance identity. Kill-switch via Auth0 M2M.        │
│ Recovery: Re-provision agents. No persistent state.      │
└──────────────────────────────────────────────────────────┘
```

### 1.3 Recovery Order

Recovery must follow dependency order. You cannot recover a downstream system before its dependencies:

```
1. Infrastructure (VPC, compute, network)
2. Identity (Auth0 — usually self-healing, but verify config)
3. Secrets (AWS Secrets Manager — verify access, rotate if compromised)
4. Authorization (OpenFGA — restore tuples, redeploy model)
5. Application (services — redeploy, restore data)
6. Agents (re-provision, re-establish delegation)
```

---

## 2. Backup Strategy

### 2.1 What Is Backed Up

| System           | What                                              | Method                                                        | Frequency                  | Storage             | Encryption      |
| ---------------- | ------------------------------------------------- | ------------------------------------------------------------- | -------------------------- | ------------------- | --------------- |
| Auth0            | Tenant config (apps, connections, actions, rules) | Auth0 Deploy CLI export or Terraform                          | On change (CI/CD)          | Git repo (IaC) + S3 | Encrypted state |
| Secrets Manager  | Secret metadata + versions                        | Built-in versioning (AWSCURRENT/PREVIOUS)                     | Automatic (every rotation) | AWS-managed         | KMS             |
| OpenFGA          | Model definition + tuple export                   | Application-level `openfga model read` + `openfga tuple read` | Daily scheduled Lambda     | S3 (encrypted)      | KMS             |
| RDS (Postgres)   | Full database                                     | Automated snapshots + continuous PITR                         | Daily + continuous         | RDS-managed         | KMS             |
| Redis            | Not backed up                                     | —                                                             | —                          | —                   | —               |
| ECS / Infra      | Task definitions, VPC, IAM                        | Terraform / IaC                                               | On change (Git)            | Git repo            | N/A             |
| Application code | Source code + Docker images                       | Git + ECR                                                     | On push                    | GitHub + ECR        | N/A             |

### 2.2 What Is Explicitly NOT Backed Up

| Data                       | Why                                                 |
| -------------------------- | --------------------------------------------------- |
| Redis cache                | Ephemeral by design. Rebuilds on service start.     |
| Token broker cache         | Ephemeral. Tokens re-issued on cache miss.          |
| In-flight agent workflows  | Agents are stateless. Workflows restart on failure. |
| CloudWatch Logs (hot tier) | Archived to S3 per ADR-036 retention strategy.      |

### 2.3 Backup Storage Isolation

Backup storage is separated from runtime access:

- RDS snapshots: accessible only by admin IAM roles (not service roles)
- S3 backup bucket: separate IAM policy, Object Lock enabled
- OpenFGA exports: encrypted in S3, accessible only by recovery Lambda/admin
- No runtime IAM role can delete or modify backups

---

## 3. Recovery Strategy

### 3.1 RTO and RPO Targets

| System               | RPO (max data loss)     | RTO (max downtime)             | Justification                                                                       |
| -------------------- | ----------------------- | ------------------------------ | ----------------------------------------------------------------------------------- |
| Auth0                | 0 (managed SLA)         | Auth0 SLA (~minutes)           | Managed service, self-healing                                                       |
| Secrets Manager      | 0 (versioned)           | Minutes (version rollback)     | AWS managed, versions always available                                              |
| OpenFGA              | 24 hours (daily export) | 1-2 hours (restore + validate) | Daily export is practical; tuple drift during day is recoverable via reconciliation |
| RDS                  | Minutes (PITR)          | 30-60 minutes (PITR restore)   | Continuous backups enable point-in-time recovery                                    |
| Application services | 0 (stateless)           | 15-30 minutes (ECS redeploy)   | Stateless containers, redeploy from ECR                                             |
| Agent runtime        | 0 (stateless)           | 15-30 minutes (re-provision)   | Stateless, re-provision M2M apps + OpenFGA tuples                                   |

### 3.2 Recovery Flow: Full Environment Rebuild

```
Step 1: Infrastructure
  └── Terraform apply (VPC, subnets, security groups, ECS cluster, ALB)

Step 2: Data stores
  └── Restore RDS from snapshot or PITR
  └── Create Redis instance (no restore needed)

Step 3: Secrets
  └── Verify Secrets Manager access (secrets persist across infra rebuild)
  └── If secrets compromised: rotate all affected secrets

Step 4: Identity
  └── Verify Auth0 tenant configuration
  └── If config drift: re-apply from Terraform/Deploy CLI export

Step 5: Authorization
  └── Deploy OpenFGA model from IaC
  └── Restore tuples from latest S3 export
  └── Run reconciliation Lambda to fix any drift

Step 6: Application
  └── Deploy services from ECR images
  └── Verify health checks pass
  └── Verify authorization decisions work (smoke test)

Step 7: Agents
  └── Re-provision agent M2M applications (if needed)
  └── Verify agent authentication works
  └── Re-establish OpenFGA delegation tuples
```

---

## 4. Secret Compromise and Rotation Response

### 4.1 Immediate Response

```
1. IDENTIFY which secret is compromised
2. ROTATE immediately:
   - DB creds: trigger Lambda rotation (creates new user, promotes AWSPENDING)
   - Auth0 M2M: call Auth0 Management API to rotate client secret, update Secrets Manager
   - API key: regenerate at provider, update Secrets Manager
3. VERIFY new credential works (Lambda testSecret step)
4. INVALIDATE old credential at the target system (if possible)
5. AUDIT: review CloudTrail for unauthorized access using old credential
6. NOTIFY affected service owners
```

### 4.2 Cascading Impact

| Compromised secret | Downstream impact                                   | Additional action                                              |
| ------------------ | --------------------------------------------------- | -------------------------------------------------------------- |
| DB credentials     | Services lose DB access briefly during rotation     | Services retry-on-auth-failure picks up new creds within 5 min |
| Auth0 M2M secret   | Service cannot authenticate until new secret loaded | Force cache eviction, re-authenticate                          |
| Agent M2M secret   | Agent cannot authenticate                           | Disable Auth0 M2M app immediately, re-provision agent          |
| OpenAI API key     | External API calls fail until new key               | Regenerate at provider, update Secrets Manager                 |

### 4.3 Emergency Rotation (All Secrets)

For a broad compromise (e.g., Secrets Manager access key leaked):

```
1. Revoke compromised IAM credentials immediately
2. Rotate ALL secrets in the affected environment
3. Restart all services to force cache eviction
4. Verify all services recover
5. Full CloudTrail audit of the compromise window
```

---

## 5. Identity Compromise Handling

### 5.1 Stolen User Token

| Action                         | How                          | Timeline      |
| ------------------------------ | ---------------------------- | ------------- |
| Revoke refresh token family    | Auth0 Management API         | Immediate     |
| Access token expires naturally | 15-minute lifetime           | Within 15 min |
| Force re-authentication        | Revoke all sessions in Auth0 | Immediate     |
| Review actions taken           | Audit log query by sub       | Within 1 hour |

### 5.2 Compromised Service Account

| Action                     | How                                    | Timeline      |
| -------------------------- | -------------------------------------- | ------------- |
| Rotate M2M client secret   | Auth0 Management API + Secrets Manager | Immediate     |
| Existing M2M tokens expire | 1-hour lifetime                        | Within 1 hour |
| Audit service actions      | CloudTrail + application audit logs    | Within 1 hour |

### 5.3 Compromised Agent Identity

| Action                        | How                                       | Timeline                |
| ----------------------------- | ----------------------------------------- | ----------------------- |
| Disable Auth0 M2M application | Auth0 Management API                      | Immediate (kill switch) |
| Purge OpenFGA tuples          | Delete all tuples for agent subject       | Immediate               |
| Delete Secrets Manager entry  | Remove agent client secret                | Immediate               |
| Audit agent actions           | Audit log query by agent sub              | Within 1 hour           |
| Notify delegating users       | Alert users whose delegations were active | Within 1 hour           |
| Re-provision (if needed)      | New M2M app, new credentials, new tuples  | After investigation     |

---

## 6. Authorization System Failure (OpenFGA)

### 6.1 Failure Modes

| Mode                        | Behavior                        | Impact                                           |
| --------------------------- | ------------------------------- | ------------------------------------------------ |
| Completely unavailable      | All OpenFGA checks return error | Fail-closed: 503 for all resource-level requests |
| Partially degraded (slow)   | OpenFGA responds but >5s        | Timeout: treated as unavailable, fail-closed     |
| Inconsistent (stale tuples) | Wrong authorization decisions   | Detected by reconciliation, fixed within hours   |
| Data corruption             | Tuples lost or malformed        | Restore from daily export                        |

### 6.2 Fail-Closed Policy (ADR-021)

When OpenFGA is unavailable:

- RBAC checks (from JWT) still work — many requests short-circuit here
- ABAC checks (from context) still work
- OpenFGA checks return 503 — request denied
- No cached OpenFGA results are used as fallback (stale authorization is worse than denial)

### 6.3 Recovery

```
1. Diagnose: Is OpenFGA process down, network issue, or data corruption?
2. Process down → restart ECS task, verify health
3. Network issue → check security groups, VPC endpoints
4. Data corruption → restore tuples from latest S3 export
5. Redeploy model definition from IaC
6. Run reconciliation Lambda to sync Auth0 state → OpenFGA
7. Verify: run smoke test authorization checks
```

---

## 7. Agent Failure and Containment

### 7.1 Kill Switch

```
Immediate:  Disable Auth0 M2M application
            → All new token requests fail instantly
            → Existing JWTs expire within 1 hour

Reinforced: Delete OpenFGA tuples for agent
            → All relationship checks fail immediately

Permanent:  Delete Secrets Manager entry
            → Agent cannot be re-provisioned without admin action
```

### 7.2 Misbehaving Agent Containment

| Scenario                         | Detection                          | Response                                   |
| -------------------------------- | ---------------------------------- | ------------------------------------------ |
| Agent exceeding rate limits      | Rate limit counter in orchestrator | Throttle → warn → disable if persistent    |
| Agent calling unauthorized tools | Authorization denial in audit logs | Alert → investigate → reduce scope or kill |
| Runaway workflow (infinite loop) | Workflow duration exceeds timeout  | Kill workflow → disable agent if recurrent |
| Agent accessing wrong tenant     | ABAC tenant check fails            | Deny + alert + investigate                 |

### 7.3 Tenant-Wide Emergency

Disable all agent M2M applications in a tenant:

```
1. List all agent M2M apps for tenant (Auth0 Management API, filter by metadata)
2. Disable each app
3. Purge all agent tuples in OpenFGA for tenant
4. Alert all affected users
5. Post-incident: re-provision agents after investigation
```

---

## 8. Infrastructure Failure Scenarios

### 8.1 AWS Region Outage

| Impact            | Mitigation                                                                          | RTO                  |
| ----------------- | ----------------------------------------------------------------------------------- | -------------------- |
| All services down | Single-region deployment (hackathon-scale). Accept downtime.                        | AWS recovery (hours) |
| Data at risk      | RDS automated backups. S3 cross-region replication for critical backups (optional). | RPO: minutes (PITR)  |

Multi-region is deferred until scale justifies it. For hackathon, accept single-region risk.

### 8.2 VPS Compromise

| Impact                             | Containment                                                   |
| ---------------------------------- | ------------------------------------------------------------- |
| Build runners, monitoring affected | Revoke Tailscale node. VPS has no production IAM credentials. |
| Dev/staging data accessible        | Non-production data only. Rotate any dev-scoped credentials.  |
| Production unaffected              | Tailscale ACL restricts VPS to dev/staging.                   |

### 8.3 Tailscale Outage

| Impact                               | Fallback                                                  |
| ------------------------------------ | --------------------------------------------------------- |
| Admin cannot reach private resources | Use AWS Console (web) with MFA.                           |
| VPS disconnected from monitoring     | CloudWatch continues independently (AWS-native).          |
| Production traffic?                  | Unaffected. Tailscale is not in the production data path. |

### 8.4 Network Partition (Service Cannot Reach Dependency)

| Partition                 | Behavior                                                                           |
| ------------------------- | ---------------------------------------------------------------------------------- |
| Service ↛ OpenFGA         | Fail-closed (503). RBAC/ABAC requests still work.                                  |
| Service ↛ Secrets Manager | Use cached secrets (5-min TTL). If cache expired, fail-closed.                     |
| Service ↛ Auth0           | JWKS cached locally. Existing token validation works. New tokens cannot be issued. |
| Service ↛ Redis           | In-memory fallback for broker cache. Degraded but functional.                      |
| Service ↛ RDS             | Service returns 503 for data-dependent requests. Health check fails.               |

---

## 9. Disaster Recovery Playbooks

### 9.1 Playbook: Full Environment Rebuild

**Trigger:** Complete environment destruction or unrecoverable corruption.

**Required role:** Admin (MFA required).

**Steps:**

1. `terraform apply` — rebuild VPC, ECS cluster, ALB, security groups, VPC endpoints
2. Restore RDS from latest automated snapshot (or PITR to specific timestamp)
3. Create Redis instance (empty — cache rebuilds on use)
4. Verify Secrets Manager secrets are accessible (they persist independently of VPC)
5. Deploy OpenFGA — apply model from IaC, restore tuples from S3 export
6. Deploy application services from ECR images
7. Run health checks on all services
8. Run authorization smoke tests (known-good allow and deny scenarios)
9. Run reconciliation Lambda (Auth0 → OpenFGA sync)
10. Verify agent authentication if agents are in use

**Validation:** All health checks green. Authorization smoke tests pass. Audit log shows recovery events.

### 9.2 Playbook: Secrets System Recovery

**Trigger:** Secrets Manager access issue or broad credential compromise.

**Required role:** Admin (MFA required).

**Steps:**

1. Verify IAM role access to Secrets Manager (check VPC endpoint, IAM policy)
2. If access issue: fix IAM/VPC configuration
3. If credential compromise: trigger emergency rotation for all affected secrets
4. Restart affected services to force cache eviction
5. Monitor service health during credential rollover (5-min cache TTL window)
6. Verify all services recover with new credentials
7. Audit CloudTrail for unauthorized access during compromise window

### 9.3 Playbook: Authorization System Rebuild

**Trigger:** OpenFGA data corruption or loss.

**Required role:** Admin (MFA required).

**Steps:**

1. Redeploy OpenFGA ECS task (if process issue)
2. Apply authorization model from IaC (`openfga model write`)
3. Restore tuples from latest daily S3 export (`openfga tuple write --file`)
4. Run reconciliation Lambda (Auth0 org membership → OpenFGA tuples)
5. Run authorization smoke tests
6. Monitor for authorization decision anomalies in the next hour

**RPO:** Up to 24 hours of tuple changes may be lost (daily export). Reconciliation Lambda recovers most drift.

### 9.4 Playbook: Identity Reconfiguration

**Trigger:** Auth0 configuration drift or corruption.

**Required role:** Admin (Auth0 tenant admin).

**Steps:**

1. Compare current Auth0 config against Terraform/Deploy CLI source of truth
2. Apply Terraform/Deploy CLI to restore correct configuration
3. Verify applications, APIs, connections, and actions are correct
4. Test user login flow end-to-end
5. Test M2M token issuance for services and agents
6. Verify JWT claims contain expected custom claims

### 9.5 Playbook: Agent System Restart

**Trigger:** Agent runtime failure or post-compromise re-provisioning.

**Required role:** Admin (MFA required).

**Steps:**

1. List all agent M2M applications in Auth0
2. For each agent: verify Auth0 app is enabled, Secrets Manager entry exists
3. Re-create any missing M2M applications
4. Store new client secrets in Secrets Manager
5. Verify OpenFGA tuples exist for each agent (executor relations)
6. Test agent authentication (token request)
7. Test agent authorization (known-good action check)

---

## 10. Recovery Access Control Model

### 10.1 Roles

| Role               | What they can do                                  | How access is granted                         |
| ------------------ | ------------------------------------------------- | --------------------------------------------- |
| Admin (day-to-day) | Deploy, monitor, rotate secrets on schedule       | IAM role with MFA                             |
| Admin (recovery)   | Restore RDS, restore OpenFGA, modify IAM policies | Elevated IAM role, MFA + break-glass approval |
| Break-glass        | Full account access for disaster recovery         | Stored offline, requires dual approval        |

### 10.2 Break-Glass Procedure

```
1. Incident declared by team lead
2. Break-glass credentials retrieved from offline storage (sealed envelope / hardware token)
3. MFA verified
4. All actions logged to CloudTrail (audit trail)
5. Recovery performed per playbook
6. Break-glass credentials rotated after use
7. Post-incident review within 48 hours
```

### 10.3 Post-Incident Requirements

Every incident recovery must be followed by:

1. **Audit log review** — what happened, what was accessed, what was changed
2. **Credential rotation** — rotate any credentials that were exposed or used during break-glass
3. **Playbook update** — document what worked, what didn't, what to improve
4. **Root cause analysis** — within 5 business days

---

## 11. Testing and Validation Strategy

### 11.1 Testing Schedule

| Test                             | Frequency          | What it validates                                     |
| -------------------------------- | ------------------ | ----------------------------------------------------- |
| RDS restore drill                | Quarterly          | Snapshot restore works, data integrity verified       |
| OpenFGA tuple restore            | Quarterly          | Export/import works, reconciliation catches drift     |
| Secret rotation (manual trigger) | Monthly            | Lambda rotation completes, services pick up new creds |
| Auth0 config drift check         | Weekly (automated) | Terraform plan shows no drift                         |
| Agent kill-switch test           | Quarterly          | Disabling M2M app stops agent within 1 hour           |
| Authorization smoke tests        | Every deployment   | Known-good allow/deny scenarios pass                  |

### 11.2 Success Criteria

| Test              | Pass if                                                          |
| ----------------- | ---------------------------------------------------------------- |
| RDS restore       | Restored database passes data integrity check, services connect  |
| OpenFGA restore   | All smoke test authorization checks return expected results      |
| Secret rotation   | Services recover within 5 minutes, no manual intervention needed |
| Agent kill-switch | Agent cannot authenticate after M2M app disabled                 |

---

## 12. Failure and Abuse Scenarios

### 12.1 Incomplete Backups

| Risk                                | Mitigation                                                      |
| ----------------------------------- | --------------------------------------------------------------- |
| OpenFGA export misses recent tuples | Reconciliation Lambda (daily) detects and fixes drift           |
| RDS snapshot fails                  | CloudWatch alarm on failed snapshot. AWS retries automatically. |
| S3 backup not written               | Lambda alarm on failed export. Manual investigation.            |

### 12.2 Corrupted Backups

| Risk                      | Mitigation                                                             |
| ------------------------- | ---------------------------------------------------------------------- |
| OpenFGA export corrupted  | Validate export on write (checksum). Keep 7 daily exports.             |
| RDS snapshot corrupted    | AWS manages snapshot integrity. Multiple snapshots retained (30 days). |
| Terraform state corrupted | State stored in S3 with versioning. Roll back to previous version.     |

### 12.3 Unauthorized Recovery Attempts

| Risk                                  | Mitigation                                                             |
| ------------------------------------- | ---------------------------------------------------------------------- |
| Non-admin attempts RDS restore        | IAM policy restricts restore to admin roles. CloudTrail alerts.        |
| Attacker uses break-glass credentials | Offline storage (physical). Dual approval required. Post-use rotation. |
| Privilege escalation during recovery  | Recovery roles are scoped. Even break-glass is CloudTrail-audited.     |

---

## 13. Reusable Skills

### 13.1 `skill.resilience.backup.strategy`

**Purpose:** Define backup requirements for a new system component.

**Inputs:** Component type, data criticality, acceptable RPO.

**Outputs:** Backup method, frequency, storage location, encryption requirements, retention.

**Steps:** Classify data criticality → select backup method → define frequency → select storage → configure encryption → document retention → verify restoration path exists.

### 13.2 `skill.resilience.restore.system`

**Purpose:** Restore a system component from backup.

**Inputs:** Component to restore, backup location, target environment.

**Outputs:** Restored component, validation result.

**Steps:** Identify latest valid backup → verify backup integrity → restore to target → run health checks → run smoke tests → update audit log.

### 13.3 `skill.secrets.rotate.emergency`

**Purpose:** Emergency rotation of a compromised secret.

**Inputs:** Secret path, compromise indicator, affected services.

**Outputs:** Rotated secret, service recovery confirmation.

**Steps:** Trigger rotation Lambda (or manual rotation) → verify new credential works → restart affected services if needed → audit old credential usage → notify team.

### 13.4 `skill.identity.revoke.compromise`

**Purpose:** Revoke a compromised identity (user, service, or agent).

**Inputs:** Compromised sub, principal type, compromise scope.

**Outputs:** Revoked identity, purged permissions, audit trail.

**Steps:** Disable Auth0 application/session → purge OpenFGA tuples → remove Secrets Manager entries (if agent) → audit actions during compromise window → notify affected parties.

### 13.5 `skill.agent.kill-switch`

**Purpose:** Immediately disable a specific agent or all agents in a tenant.

**Inputs:** Agent instance ID (or tenant ID for tenant-wide), reason.

**Outputs:** Disabled agent(s), purged tuples, audit event.

**Steps:** Disable Auth0 M2M app → purge OpenFGA tuples → remove Secrets Manager entry → log kill-switch event → notify affected users.

### 13.6 `skill.resilience.test.recovery`

**Purpose:** Execute a recovery drill for a specific system.

**Inputs:** System to test, test environment, drill type.

**Outputs:** Drill result (pass/fail), issues found, playbook updates.

**Steps:** Select backup to restore → execute restoration in test environment → run validation checks → document results → update playbook if gaps found.

---

## Related ADRs

- [ADR-037: Backup Strategy](../decisions/ADR-037-backup-strategy.md)
- [ADR-038: Recovery Ordering Model](../decisions/ADR-038-recovery-ordering.md)
- [ADR-039: Secret Compromise Response Strategy](../decisions/ADR-039-secret-compromise-response.md)
- [ADR-040: OpenFGA Failure Policy](../decisions/ADR-040-openfga-failure-policy.md)
- [ADR-041: Break-Glass Access Model](../decisions/ADR-041-break-glass-access.md)
