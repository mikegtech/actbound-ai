# Video Script (Under 3 Minutes)

## Pre-Recording Checklist

- [ ] Orchestrator running on port 3001
- [ ] Web app running on port 5173
- [ ] Redis running (optional — broker falls back to in-memory)
- [ ] Browser at `http://localhost:5173` with dashboard loaded
- [ ] Screen recording tool ready (OBS, Loom, or QuickTime)
- [ ] Resolution: 1920x1080 recommended

---

## Script

### [0:00–0:15] Opening — Narrate over title card or repo view

> "ActBound AI is a Zero Trust agent platform built for the Auth0 hackathon. It demonstrates how AI agents can safely act on behalf of users using Auth0 Token Vault, a centralized authorization engine, and a cache-first token broker — with full auditability at every step."

### [0:15–0:45] User Control Dashboard — Show the User Control panel

> "When a user opens ActBound, they immediately see their access posture. This dashboard shows how many permissions are allowed or denied, how many accounts are connected, active delegation grants, and a running count of audit events — including any revocations."

_Highlight the numbers. Pause briefly on each metric._

> "All of these metrics are computed by the backend. The React frontend renders what it receives — it never evaluates policy rules."

### [0:45–1:15] Permissions — Show the Permissions panel

> "The permission engine evaluates 21 typed permissions using role-based, attribute-based, and relationship-based checks. Each decision includes a reason code — not just 'allowed' or 'denied' but exactly why."

_Scroll through a few decisions. Point out one allowed and one denied with reason codes._

> "This is the foundation of user control: the user can see exactly what they can and cannot do."

### [1:15–1:45] Delegated Access + Token Broker — Show both panels

> "Users connect third-party providers through Auth0 Token Vault. Here's a Google account with delegated scopes. The consent model tracks what the user authorized and what sensitive actions require step-up authentication."

_Show connected provider, then switch to Token Broker panel._

> "The token broker is cache-first. It previews token requests without side effects, checks authorization before issuance, and returns safe metadata only — the raw JWT never reaches the frontend. This pattern also reduces Auth0 M2M API calls."

_Click Preview, then Retrieve._

### [1:45–2:30] Activity Timeline + Audit — Show the Activity Timeline panel

> "Every significant action is recorded in the audit trail. Users can see what happened, who acted, whether it was allowed or denied, and whether step-up authentication was required."

_Point out specific events: a successful agent action, a denied sensitive action, a token broker retrieval._

> "Notice this denied event — the agent tried to execute a sensitive financial trade, but step-up authentication wasn't satisfied. The reason code is right there in the decision."

_Point to the `step_up_required` event._

> "This is what observable authorization looks like: users understand not just what happened, but why."

### [2:30–2:50] Architecture — Narrate over the dashboard or a brief diagram

> "Under the hood, ActBound uses a pnpm monorepo with shared Zod contracts, a NestJS orchestrator, a centralized authorization package with full test coverage, and CI pipelines with secret scanning, CodeQL, and Semgrep. Every architectural decision is recorded in 43 ADRs."

### [2:50–3:00] Closing

> "ActBound AI shows that AI agents don't need to be uncontrolled credential consumers. With Auth0 Token Vault, delegated access is safe, revocable, and observable. Thank you."

---

## Recording Tips

- Keep mouse movements slow and deliberate
- Pause briefly when showing key data (decisions, reason codes, audit events)
- Use a calm, clear speaking voice at a moderate pace
- If you make a mistake, keep going — judges prefer authentic to over-polished
- Aim for 2:45 to leave buffer under the 3-minute limit
