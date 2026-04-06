# Production Data Model Alignment

## Database Layout

```
Postgres (actbound-postgres)
├── openfga database         ← OpenFGA engine (tuples, authorization models)
│   └── managed by OpenFGA   ← never query directly
│
└── actbound database        ← orchestrator-api + app services
    ├── audit schema          ← append-only audit trail
    │   └── audit_events      ← durable security/observability events
    │
    └── public schema         ← app tables (future)
        ├── organizations     ← TODO: org metadata, settings, status
        ├── users             ← TODO: user projection from Auth0
        ├── assistants        ← TODO: assistant metadata, config, status
        ├── resources         ← TODO: resource metadata, ownership
        ├── invitations       ← TODO: invitation lifecycle
        └── ...
```

## Storage Boundary Rules

Every piece of data has exactly one authoritative home.

### Three storage systems

| System                 | Purpose                                                     | Characteristics                                   |
| ---------------------- | ----------------------------------------------------------- | ------------------------------------------------- |
| App DB (public schema) | Rich entity state, operational workflows, business metadata | Read-write, supports queries, joins, updates      |
| OpenFGA (openfga DB)   | Authorization relationships (tuples)                        | Write via API, check via API, no rich metadata    |
| Audit schema           | Immutable event history, security trail                     | Append-only, no updates, no user-facing mutations |

### Decision rules

| Question                                     | Answer                                          |
| -------------------------------------------- | ----------------------------------------------- |
| "Where does entity metadata live?"           | App DB                                          |
| "Where do authorization relationships live?" | OpenFGA                                         |
| "Where does event history live?"             | Audit schema                                    |
| "Can I query OpenFGA for entity details?"    | No — OpenFGA stores relationships, not metadata |
| "Can I update audit events?"                 | No — audit is append-only                       |
| "Can I use audit as operational state?"      | No — audit is a trail, not a state machine      |

## Entity Ownership Matrix

### Organizations

| Concern                                           | System  | Notes                          |
| ------------------------------------------------- | ------- | ------------------------------ |
| Org metadata (name, status, settings)             | App DB  | TODO: organizations table      |
| Org membership (user X is member/admin of org Y)  | OpenFGA | `user:X member organization:Y` |
| Org lifecycle events (created, updated, archived) | Audit   | Durable event records          |

### Users

| Concern                                              | System  | Notes                                        |
| ---------------------------------------------------- | ------- | -------------------------------------------- |
| User profile (Auth0 source of truth)                 | Auth0   | Never duplicate PII in app DB                |
| App user projection (sub, display name, preferences) | App DB  | TODO: users table, keyed by Auth0 sub        |
| User-org relationships                               | OpenFGA | `user:X member organization:Y`               |
| User-resource relationships                          | OpenFGA | `user:X viewer resource:Z`                   |
| User activity/audit                                  | Audit   | All access, grant, revoke, delegation events |

### Assistants

| Concern                                                      | System  | Notes                            |
| ------------------------------------------------------------ | ------- | -------------------------------- |
| Assistant metadata (type, config, status, kill-switch state) | App DB  | TODO: assistants table           |
| Assistant identity (Auth0 M2M app)                           | Auth0   | Per-instance identity (ADR-007)  |
| Assistant-org membership                                     | OpenFGA | `agent:X member organization:Y`  |
| Assistant-resource access                                    | OpenFGA | `agent:X viewer resource:Z`      |
| Assistant execution trail                                    | Audit   | Every action, delegation, denial |

### Resources

| Concern                                                | System           | Notes                                                  |
| ------------------------------------------------------ | ---------------- | ------------------------------------------------------ |
| Resource metadata (type, name, status, classification) | App DB           | TODO: resources table                                  |
| Resource ownership                                     | App DB + OpenFGA | App DB has rich metadata; OpenFGA has `owner` relation |
| Resource access relationships                          | OpenFGA          | `user:X editor resource:Z`, org inheritance            |
| Resource access change history                         | Audit            | Grants, revokes, ownership transfers                   |

### Invitations

| Concern                                                | System  | Notes                                     |
| ------------------------------------------------------ | ------- | ----------------------------------------- |
| Invitation state (pending, accepted, expired, revoked) | App DB  | Authoritative for lifecycle               |
| Active access (only after accepted)                    | OpenFGA | Tuple written on acceptance               |
| Invitation lifecycle events                            | Audit   | Created, sent, accepted, expired, revoked |

### Pending States

| Concern                                    | System  | Notes                            |
| ------------------------------------------ | ------- | -------------------------------- |
| Pending approval/review state              | App DB  | Authoritative                    |
| Active authorization (only after approved) | OpenFGA | No tuple until state transitions |
| State transitions                          | Audit   | Every transition recorded        |

### Revocations

| Concern                    | System  | Notes                                |
| -------------------------- | ------- | ------------------------------------ |
| Business revocation record | App DB  | If the app needs revocation metadata |
| Active access removal      | OpenFGA | Tuple deleted on revocation          |
| Immutable revocation event | Audit   | Always recorded, never deleted       |

### Ownership Metadata

| Concern                                                | System  | Notes                                     |
| ------------------------------------------------------ | ------- | ----------------------------------------- |
| Rich ownership metadata (transfer history, conditions) | App DB  | Authoritative                             |
| Owner relation for authorization                       | OpenFGA | `user:X owner resource:Z`                 |
| Ownership change events                                | Audit   | Transfer, assignment, inheritance changes |

## What Must Never Be Stored Where

| Never store in...   | These things                                               |
| ------------------- | ---------------------------------------------------------- |
| OpenFGA             | Entity metadata, profiles, settings, PII, business state   |
| Audit schema        | Mutable operational state, secrets, tokens, PII beyond sub |
| App DB (as primary) | Authorization relationships (duplicate of OpenFGA)         |

## Remaining TODO: Future App Tables

These tables are not yet implemented but their storage boundaries are defined above:

- [ ] `public.organizations` — org metadata, settings, status
- [ ] `public.users` — app user projection (Auth0 sub, display name, preferences)
- [ ] `public.assistants` — assistant metadata, type, config, status, kill-switch state
- [ ] `public.resources` — resource metadata, type, status, classification
- [ ] `public.invitations` — invitation lifecycle state machine
- [ ] `public.ownership_transfers` — ownership change records (if needed beyond audit)

When these tables are added, follow the same pattern:

1. Migration in `services/orchestrator-api/migrations/`
2. Drizzle schema in `services/orchestrator-api/src/infrastructure/database/schema.ts`
3. Domain repository interface in `src/domain/`
4. Infrastructure implementation in `src/infrastructure/database/`
