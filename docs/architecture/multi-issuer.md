Here’s a concrete architecture spec you can use for ActBound.

# Multi-Issuer Identity Architecture Spec

## Auth0 + Okta bearer tokens with shared permissions

### Goal

Allow ActBound to accept bearer tokens from multiple trusted identity providers, including Auth0 and Okta, while enforcing one shared authorization model across tenants, organizations, users, services, and assistants.

The shared authorization model includes:

- RBAC
- ABAC
- OpenFGA relationships
- delegated execution checks
- assistant runtime checks
- audit attribution
- explainability

The identity provider should affect authentication and claim normalization, but not the downstream permission semantics.

---

## 1. Core design principle

Authentication is provider-specific.
Authorization is provider-agnostic.

That means:

- Auth0 and Okta may issue different JWTs
- ActBound validates them against different issuer configurations
- ActBound normalizes them into one internal principal model
- ActBound runs the same authorization logic regardless of source IdP

### Result

A tenant using Auth0 and a tenant using Okta can both use:

- the same permission names
- the same OpenFGA model
- the same policy engine
- the same assistant runtime logic

as long as their identities are normalized consistently.

---

## 2. Trust model

ActBound must never trust arbitrary OIDC tokens just because they are well-formed.

ActBound must maintain an explicit trusted issuer registry.

### Trusted issuer registry

For each tenant, store:

- issuer URL
- JWKS URL or discovery metadata source
- allowed audiences
- token use/type expectations
- claim mapping profile
- status
- optional org/tenant scoping rules

### Example

Tenant A:

- IdP: Auth0
- issuer: `https://tenant-a.us.auth0.com/`
- audience: `https://api.actbound.ai`

Tenant B:

- IdP: Okta
- issuer: `https://acme.okta.com/oauth2/default`
- audience: `api://actbound`

### Security rule

A token is accepted only if:

- issuer is configured and active for the tenant
- audience matches a configured audience
- signature validates using that issuer’s JWKS
- token is not expired and is otherwise valid
- tenant ↔ issuer relationship is allowed

---

## 3. Supported principal classes

ActBound continues to support three first-class principal types:

- `user`
- `service`
- `agent`

### Recommended issuer strategy

- Human users may come from Auth0 or Okta
- Service principals may come from your platform IdP or a trusted enterprise IdP
- Agent principals should preferably remain platform-controlled unless there is a strong reason to externalize them

This reduces risk and complexity for assistant runtime controls.

---

## 4. Normalized principal model

Every accepted token must be converted to one internal principal shape before authorization.

```ts
type NormalizedPrincipal = {
  issuer: string;
  issuerType: "auth0" | "okta" | "other";
  externalSubject: string;
  internalSubject: string;
  principalType: "user" | "service" | "agent";
  tenantId: string;
  organizationIds: string[];
  roles: string[];
  clientId?: string;
  onBehalfOf?: string;
  authSource: "interactive" | "m2m" | "delegated";
  rawClaimsRef?: string;
};
```

### Field meanings

- `issuer`: the trusted token issuer
- `externalSubject`: raw IdP subject, usually JWT `sub`
- `internalSubject`: stable app-local identity key used by ActBound
- `principalType`: user, service, or agent
- `tenantId`: ActBound tenant boundary
- `organizationIds`: optional org scope
- `roles`: normalized coarse-grained roles
- `onBehalfOf`: delegated user context when applicable
- `authSource`: how the token was obtained and used

### Rule

All authorization uses `NormalizedPrincipal`, not raw JWT claims.

---

## 5. Identity binding model

This is the most important identity decision.

Raw `sub` values are not sufficient across multiple issuers.

### Required binding key

Store external identities using:

- `issuer`
- `external_sub`

and bind them to an app-local identity such as:

- `internal_user_id`

### Recommended table

`identity_bindings`

Fields:

- `id`
- `tenant_id`
- `issuer`
- `external_sub`
- `principal_type`
- `internal_subject`
- `created_at`
- `updated_at`
- `status`

### Why this matters

The same person from:

- Auth0 issuer A
- Okta issuer B

must not collide accidentally.

Likewise, two different people with similar email addresses must not be merged automatically unless you explicitly support account linking.

### Recommended rule

Use internal app IDs as the canonical authorization subjects.

So instead of OpenFGA subjects like:

- `user:auth0|abc123`
- `user:okta|xyz456`

prefer:

- `user:usr_01H...`

That keeps your OpenFGA space stable even if upstream IdP bindings change.

---

## 6. Claim normalization profiles

Auth0 and Okta claims differ, so ActBound needs issuer-specific mapping profiles.

### Auth0 example

Claims might include:

- `sub`
- `aud`
- `azp`
- `https://actbound.ai/principal_type`
- `https://actbound.ai/roles`
- `https://actbound.ai/tenant_id`

### Okta example

Claims might include:

- `sub`
- `aud`
- `cid`
- `groups`
- custom claims for tenant/org context

### Normalization layer responsibilities

For each issuer profile:

- map raw `sub` → `externalSubject`
- infer `principalType`
- map role/group claims → normalized roles
- extract `tenantId`
- extract org context if present
- map delegated claims if supported
- reject tokens missing required normalized fields

### Important rule

Do not place fine-grained permissions in JWTs.
JWTs carry identity and coarse role context only.

---

## 7. Authorization model remains shared

Once normalized, both Auth0 and Okta principals use the same authorization flow:

1. Validate token
2. Normalize claims
3. Resolve internal subject
4. Load app-local projection if needed
5. RBAC check
6. ABAC evaluation
7. OpenFGA check
8. Delegation and assistant runtime checks
9. Final decision
10. Audit + explainability output

This means the following are shared across issuers:

- role semantics
- policy semantics
- relationship semantics
- assistant action rules
- explainability format
- audit taxonomy

---

## 8. Tenant-aware issuer policy

ActBound must not assume every tenant trusts every issuer.

### Recommended model

Each tenant has a configured issuer allowlist.

Example:

- Tenant Alpha trusts Auth0 issuer X
- Tenant Beta trusts Okta issuer Y
- Tenant Gamma trusts Auth0 issuer X and Okta issuer Z

### Enforcement rule

Before accepting a token:

- resolve tenant context
- verify that issuer is allowed for that tenant
- apply the correct normalization profile

### Failure mode

If the issuer is not configured for the tenant:

- reject the request
- emit structured auth failure
- audit as an authentication failure, not an authorization denial

---

## 9. App DB model

The app DB should store issuer-independent operational state plus identity bindings.

### Recommended core tables

- `users`
- `identity_bindings`
- `organizations`
- `organization_memberships`
- `assistants`
- `resources`
- `invitations`
- `revocations`

### `users`

Should represent app-local identities, not raw IdP users.

Suggested fields:

- `id`
- `tenant_id`
- `display_name`
- `email`
- `status`
- `created_at`
- `updated_at`

### Identity flow

Issuer token → normalization → `identity_bindings` lookup → `users.id`

That `users.id` becomes the internal subject used in authorization and OpenFGA.

---

## 10. OpenFGA subject strategy

OpenFGA should not depend on external IdP subject formats if you can avoid it.

### Preferred strategy

Use app-local subject IDs:

- `user:usr_123`
- `service:svc_123`
- `agent:agt_123`

### Why

This gives you:

- stable tuple identity
- easier IdP migration
- simpler account linking
- cleaner audit and explainability
- less leakage of issuer-specific semantics into authorization

### When to use issuer-aware subjects

Only if app-local identity binding does not yet exist.
That is acceptable as a temporary bootstrap pattern, not the desired long-term one.

---

## 11. Delegated execution across issuers

Delegation should work the same way regardless of upstream IdP.

### Example

A user authenticated via Okta delegates permission to an assistant.
The assistant itself may be platform-issued.
The assistant runtime still evaluates:

- assistant capability
- user consent/delegation
- user resource authorization

Because the user was normalized into an internal subject, the authorization engine does not need to care whether the user originally came from Auth0 or Okta.

### Rule

Delegation relationships must attach to the internal subject, not the raw external `sub`.

---

## 12. Audit model

Audit must preserve both:

- internal authorization identity
- external authentication source

### Recommended audit identity fields

- `actor_internal_subject`
- `actor_principal_type`
- `actor_issuer`
- `actor_external_subject`
- `tenant_id`

This lets you answer both:

- “Who did this in our system?”
- “Which external identity provider authenticated them?”

### Example

```json
{
  "actor_internal_subject": "usr_123",
  "actor_principal_type": "user",
  "actor_issuer": "https://acme.okta.com/oauth2/default",
  "actor_external_subject": "00u12abcXYZ",
  "tenant_id": "tenant_acme"
}
```

---

## 13. Explainability model

Explainability should remain provider-neutral after normalization.

The explanation should be about:

- role assignment
- policy evaluation
- relationship graph
- delegated context
- resource state

not about raw Auth0 or Okta claim peculiarities.

### Good explanation

“Allowed because internal user `usr_123` is an organization admin and has a direct viewer relationship to resource `res_456`.”

### Bad explanation

“Allowed because claim `groups=Acme_Admins` appeared in Okta token.”

The latter may be useful for debug logs, but not as the core permission explanation.

---

## 14. Sync and lifecycle model

Your new sync-service is the right place for multi-issuer lifecycle projection.

### Responsibilities

- project issuer users into app-local `users`
- maintain `identity_bindings`
- project org membership changes
- update app DB and OpenFGA as needed
- reconcile drift between expected state and active tuples

### Future provider adapters

Add issuer-specific adapters:

- Auth0 event adapter
- Okta event adapter

Both should emit the same normalized internal sync events.

---

## 15. Failure handling

### Authentication failure

Occurs when:

- issuer is unknown
- signature invalid
- audience invalid
- token expired
- tenant does not trust issuer
- required normalized claims missing

Result:

- request rejected before authorization
- not treated as permission denial

### Identity binding failure

Occurs when:

- issuer is trusted
- token is valid
- but no internal binding exists and auto-provisioning is not allowed

Result:

- fail closed
- audit as identity resolution failure
- optionally route through invitation/provisioning flow

### Authorization failure

Occurs after successful normalization and identity binding.

Result:

- standard permission denial path

---

## 16. Recommended implementation components

### A. Trusted issuer registry

A service/repository that resolves:

- tenant → allowed issuers
- issuer → claim mapping profile
- issuer → JWKS / metadata settings

### B. JWT validator

Validates:

- issuer
- audience
- signature
- token timestamps

### C. Claims normalizer

Maps raw claims into `NormalizedPrincipal`.

### D. Identity resolver

Maps:

- `issuer + external_sub` → `internal_subject`

### E. Authorization context builder

Builds the normalized context consumed by:

- RBAC
- ABAC
- OpenFGA
- assistant runtime

### F. Audit enricher

Adds:

- issuer
- external subject
- internal subject
  to audit records

---

## 17. Example request flow

### Auth0 tenant

1. Request arrives with Auth0 bearer token
2. API validates Auth0 issuer and audience
3. Claims normalizer maps Auth0 custom claims
4. Identity resolver finds `internal_subject = usr_101`
5. Authorization runs using `usr_101`
6. OpenFGA checks relationships for `user:usr_101`
7. Decision returned
8. Audit records both Auth0 source and internal subject

### Okta tenant

1. Request arrives with Okta bearer token
2. API validates Okta issuer and audience
3. Claims normalizer maps Okta groups/custom claims
4. Identity resolver finds `internal_subject = usr_202`
5. Authorization runs using `usr_202`
6. OpenFGA checks relationships for `user:usr_202`
7. Decision returned
8. Audit records both Okta source and internal subject

Same permission system. Different authentication source.

---

## 18. Security rules

### Must do

- allowlist issuers per tenant
- validate issuer/audience/signature
- normalize claims
- resolve internal subject
- use internal subject for OpenFGA when possible
- fail closed on normalization/binding problems
- audit issuer + internal identity

### Must not do

- trust arbitrary OIDC tokens
- rely on raw `sub` globally across issuers
- put fine-grained permissions in bearer tokens
- bypass internal identity resolution for convenience
- leak provider-specific claim quirks into authorization semantics

---

## 19. Recommendation for ActBound

For your platform, I recommend:

### Near-term

- keep Auth0 as the primary platform-controlled issuer
- add multi-issuer acceptance for customer users
- normalize Okta/Auth0 users into app-local identities
- keep assistants platform-controlled
- keep OpenFGA keyed to internal subject IDs

### Medium-term

- support per-tenant issuer registries
- add provider-specific sync adapters
- support controlled account linking if the same human appears across issuers

---

## 20. Bottom line

Yes, ActBound can support bearer tokens from both Auth0 and Okta while enforcing the same permissions.

But the correct design is:

- **multi-issuer authentication**
- **single normalized identity model**
- **single shared authorization model**

That is how you keep the system secure, understandable, and extensible.

If you want, next I can turn this into a **Codex implementation prompt** for multi-issuer Auth0 + Okta support in your repo.
