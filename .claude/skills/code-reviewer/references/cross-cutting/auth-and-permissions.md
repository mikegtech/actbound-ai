# Cross-Cutting Rules — Auth and Permissions

## Purpose

Use this file whenever a change touches authentication, authorization, identity normalization, delegated access, claims, token handling, tenant isolation, or permission evaluation.

This repository is built on a strict Zero Trust model:

- backend is authoritative
- CASL is advisory UX only
- RBAC, ABAC, and OpenFGA are separate layers
- delegated actions require the intersection of agent capability, user consent, and user authorization
- fail-closed behavior is mandatory

## Reviewer priorities

1. preserve backend-authoritative enforcement
2. prevent permission widening
3. preserve tenant and issuer isolation
4. protect token and consent boundaries
5. maintain explicit denial and fail-closed behavior

## Flag as blocker

- auth bypasses
- permission widening without clear intent
- frontend becoming authoritative for access control
- collapse of RBAC, ABAC, and OpenFGA into overlapping or ambiguous logic
- raw external issuer claims being trusted without normalization where normalization is required
- delegated execution without full intersection checks
- token handling that leaks raw tokens outside intended boundaries
- violating the Token Vault versus Secrets Manager ownership boundary
- fail-open handling for authentication or authorization dependencies
- missing tenant boundary enforcement
- using cached or inferred access in place of required authorization checks

## Flag as high severity

- weak claim validation
- missing issuer-awareness in multi-issuer paths
- weak denial reason reporting for security-relevant outcomes
- security-sensitive flows without tests
- unclear principal typing across user, service, and agent paths
- incomplete revocation handling
- inconsistent consent or delegation semantics across services

## Review for

- every request has a principal
- principal type is explicit and used correctly
- issuer + sub normalization is preserved where required
- tenant_id handling is consistent and enforced
- roles remain coarse and permissions remain runtime-resolved
- OpenFGA is used for relationships, not as a replacement for all auth logic
- delegated flows enforce capability + consent + user authorization intersection
- denial paths are explicit and safe
- no logging of tokens, secret values, or disallowed PII
- security-sensitive changes update docs and tests where appropriate

## Related repo principles

- backend is the source of truth
- CASL is advisory only
- no fail-open authorization path
- no shared/global agent credentials
- Token Vault is only for user-delegated external OAuth tokens
- Secrets Manager is for platform secrets
