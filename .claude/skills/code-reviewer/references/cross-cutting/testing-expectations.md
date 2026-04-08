# Cross-Cutting Rules — Testing Expectations

## Purpose

Use this file whenever a change alters behavior, contracts, enforcement, orchestration, projections, identity handling, or repo-wide configuration.

This repo has a high bar for security, auditability, and boundary correctness. Tests are not optional for meaningful logic changes.

## Reviewer priorities

1. require proof for meaningful behavior changes
2. preserve fail-closed behavior under failure modes
3. ensure security-sensitive paths are covered
4. ensure cross-package changes verify downstream impact
5. distinguish trivial edits from behavior changes honestly

## Require tests or equivalent validation for

- auth and authorization logic
- permission model changes
- token broker behavior
- delegated access flows
- multi-issuer normalization
- OpenFGA tuple/model changes
- projection and reconciliation handlers
- route and DTO changes
- typed client or schema changes
- audit and observability behavior with functional impact
- CI/config changes with repo-wide blast radius

## Flag as blocker

- security-relevant behavior changes without tests
- fail-closed or denial-path changes without coverage
- contract changes without validation of impacted consumers
- projection/revocation logic changes without replay or failure coverage
- repo-wide config or automation changes without verification evidence

## Flag as high severity

- weak or overly narrow tests that miss the changed behavior
- tests that only assert happy paths for security-sensitive logic
- missing integration tests where boundary behavior is the real risk
- changed behavior justified only by manual reasoning when automated checks are feasible

## Review for

- the test type matches the risk:
  - unit tests for deterministic local logic
  - integration tests for boundary and wiring behavior
  - contract validation for DTO/schema/client changes
  - failure-path tests for denial and dependency outage behavior
- security-sensitive changes include deny/failure cases, not just allow/success
- mixed-path PRs include enough verification across changed layers
- test names and assertions describe the actual risk being covered

## Acceptable exceptions

Only low-risk changes may avoid tests, such as:

- comments
- spelling and wording
- formatting
- non-behavioral documentation
- clearly mechanical refactors with unchanged behavior and strong existing coverage

If a PR skips tests for a meaningful change, the reviewer should call that out explicitly.
