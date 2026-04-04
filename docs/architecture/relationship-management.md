# Relationship Management Service

## Purpose

Business-level API for managing authorization relationships through OpenFGA. Users, organizations, resources, and assistants are managed through domain endpoints — not raw tuple editing.

## Naming Convention

| Business term  | OpenFGA type   | Why                                                                                                                                               |
| -------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `assistant`    | `agent`        | "Agent" is reserved for real estate domain usage (listing agent, buyer's agent). The AI/platform actor is called "assistant" in all API surfaces. |
| `user`         | `user`         | Direct mapping                                                                                                                                    |
| `organization` | `organization` | Direct mapping                                                                                                                                    |
| `resource`     | `resource`     | Direct mapping                                                                                                                                    |

## Endpoints

### Organization Membership

| Method | Path                                    | Action             |
| ------ | --------------------------------------- | ------------------ |
| POST   | `/organizations/:orgId/members`         | Add user as member |
| DELETE | `/organizations/:orgId/members/:userId` | Remove user member |
| POST   | `/organizations/:orgId/admins`          | Add user as admin  |
| DELETE | `/organizations/:orgId/admins/:userId`  | Remove user admin  |

### Assistant Organization Assignment

| Method | Path                                            | Action                    |
| ------ | ----------------------------------------------- | ------------------------- |
| POST   | `/assistants/:assistantId/organizations`        | Assign assistant to org   |
| DELETE | `/assistants/:assistantId/organizations/:orgId` | Remove assistant from org |

### Resource Access

| Method | Path                                                    | Action                               |
| ------ | ------------------------------------------------------- | ------------------------------------ |
| POST   | `/resources/:resourceId/access/users`                   | Grant user access (viewer or editor) |
| DELETE | `/resources/:resourceId/access/users/:userId`           | Revoke user access                   |
| POST   | `/resources/:resourceId/access/assistants`              | Grant assistant access               |
| DELETE | `/resources/:resourceId/access/assistants/:assistantId` | Revoke assistant access              |

## Valid Relations

| Object type    | Valid relations    |
| -------------- | ------------------ |
| `organization` | `member`, `admin`  |
| `resource`     | `viewer`, `editor` |

Invalid combinations are rejected with a 400 error.

## How Business Actions Map to OpenFGA

| Business Action                                  | OpenFGA Tuple                                |
| ------------------------------------------------ | -------------------------------------------- |
| Add user alice as member of org acme             | `write user:alice member organization:acme`  |
| Add assistant bot-1 to org acme                  | `write agent:bot-1 member organization:acme` |
| Grant user bob editor on resource proj-1         | `write user:bob editor resource:proj-1`      |
| Revoke assistant bot-1 viewer on resource proj-1 | `delete agent:bot-1 viewer resource:proj-1`  |

Note: `assistant` in the API maps to `agent` in OpenFGA tuples.

## Architecture

```
Controller (business endpoints)
    │
    ▼
RelationshipManagementService (validation, logging, mapping)
    │
    ▼
RelationshipWriter (packages/openfga — idempotent tuple write/delete)
    │
    ▼
OpenFGA API
```

## Idempotency

- **Grant**: writing an existing tuple returns `already_exists` (treated as success)
- **Revoke**: deleting a non-existent tuple returns `not_found` (treated as success)
- **Invalid relations**: rejected immediately with 400, no OpenFGA call made

## Running Tests

```bash
pnpm test
```

The relationship service tests mock the OpenFGA writer and verify:

- Correct tuple formation (user → user:id, assistant → agent:id)
- Idempotent handling (already_exists, not_found)
- Relation validation (invalid combos rejected)
- Both grant and revoke paths
