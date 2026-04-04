# Demo Flow (3-Minute Maximum)

## Setup Before Recording

1. `docker compose up -d redis`
2. `pnpm dev:orchestrator` (port 3001)
3. `pnpm dev:web` (port 5173)
4. Open browser to `http://localhost:5173`

---

## Demo Script

### Opening (15 seconds)

"ActBound AI lets users safely authorize AI agents to act on their behalf. We built a Zero Trust architecture using Auth0 Token Vault for delegated access, a token broker for M2M optimization, and a centralized authorization engine — all with full auditability."

### Screen 1: User Control Dashboard (30 seconds) — MUST SHOW

Show the User Control panel:

- "Here's the user's access dashboard. The backend computes every metric — the frontend just renders it."
- Point out: permissions count (allowed vs denied), connected accounts, active grants, recent activity.
- "Every number comes from the authorization engine and audit store. Nothing is hardcoded in the UI."

### Screen 2: Permissions Panel (30 seconds) — MUST SHOW

Show the Permissions panel:

- "These are the user's resolved permissions. Each one is evaluated by our centralized policy engine with 21 typed permissions."
- Click through a few decisions showing `allowed` and `denied` with reason codes.
- "The frontend consumes these decisions. It never evaluates policy rules."

### Screen 3: Delegated Access (30 seconds) — MUST SHOW

Show the Delegated Access panel:

- "Users connect third-party providers through Auth0 Token Vault. Here's a connected Google account with delegated scopes."
- Show consent summaries and vault sessions.
- "The token broker routes delegated requests separately from M2M — and checks authorization before retrieving any Token Vault tokens."

### Screen 4: Token Broker (30 seconds) — MUST SHOW

Show the Token Broker panel:

- "Our broker is cache-first. It reduces Auth0 M2M API calls by caching tokens until expiry."
- Click "Preview Token" to show the preview flow.
- "The preview shows the cache key, authorization decision, and step-up requirements — all without side effects."
- Click "Retrieve Token" to show the issuance flow.
- "The response returns safe metadata only. The raw JWT never reaches the frontend."

### Screen 5: Activity Timeline (30 seconds) — MUST SHOW

Show the Activity Timeline panel:

- "Every authorization decision, agent action, and broker request is recorded in the audit trail."
- Point out the event types: `agent_action.execute.success`, `sensitive_action.execute.denied`, `token_broker.retrieve.success`.
- "Users can see what happened, who acted, whether it was allowed or denied, and whether step-up was required."
- Point out the denied event with `step_up_required`.

### Screen 6: Agent Action (15 seconds) — NICE TO SHOW

Show the Actions panel:

- Preview and execute an agent action.
- "The agent acts on behalf of the user. Authorization checks both the agent's capability and the user's delegation."

### Closing (15 seconds)

"ActBound AI demonstrates that AI agents can be secure operators — not uncontrolled credential consumers. Auth0 Token Vault provides delegated access, our policy engine enforces boundaries, and every decision is observable."

---

## Must Show vs Nice to Show

| Screen                 | Priority     | Why                                                     |
| ---------------------- | ------------ | ------------------------------------------------------- |
| User Control Dashboard | Must show    | Demonstrates user-visible control and auditability      |
| Permissions Panel      | Must show    | Shows centralized authorization decisions               |
| Delegated Access       | Must show    | Shows Token Vault integration and consent model         |
| Token Broker           | Must show    | Shows M2M optimization and safe metadata pattern        |
| Activity Timeline      | Must show    | Shows audit trail and decision explanations             |
| Agent Action           | Nice to show | Shows delegation model (skip if time is tight)          |
| Context Panel          | Nice to show | Shows internal authorization context (technical detail) |

## Total Estimated Time

| Section           | Duration  |
| ----------------- | --------- |
| Opening           | 15s       |
| User Control      | 30s       |
| Permissions       | 30s       |
| Delegated Access  | 30s       |
| Token Broker      | 30s       |
| Activity Timeline | 30s       |
| Closing           | 15s       |
| **Total**         | **~3:00** |
