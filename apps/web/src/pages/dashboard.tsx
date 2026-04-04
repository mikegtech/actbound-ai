import { useEffect, useRef, useState } from "react";
import type {
  ActivityTimelineEntry,
  PermissionDecisionRecord,
  PolicyView,
  ProviderConnection,
  UserControlSummary,
} from "@actbound/sdk";
import { OrchestratorApiClient } from "@actbound/sdk";
import { StatusPill } from "@actbound/ui";
import { useAuth } from "../providers/auth";
import { useConfig } from "../providers/config";

type NavSection =
  | "dashboard"
  | "permissions"
  | "connections"
  | "activity"
  | "broker";

export function DashboardPage() {
  const { user, logout, mode } = useAuth();
  const config = useConfig();
  const [section, setSection] = useState<NavSection>("dashboard");
  const [decisions, setDecisions] = useState<PermissionDecisionRecord[]>([]);
  const [policies, setPolicies] = useState<PolicyView[]>([]);
  const [connections, setConnections] = useState<ProviderConnection[]>([]);
  const [activity, setActivity] = useState<ActivityTimelineEntry[]>([]);
  const [controlSummary, setControlSummary] =
    useState<UserControlSummary | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const didLoad = useRef(false);

  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;

    const client = new OrchestratorApiClient(config.orchestratorApiUrl);

    async function load() {
      setIsLoading(true);
      try {
        const [permRes, connRes, actRes, ctrlRes, policyRes] =
          await Promise.all([
            client.getMePermissions(),
            client.getConnections(),
            client.getMeActivity(),
            client.getMeControlSummary(),
            client.getPolicies(),
          ]);
        setDecisions(permRes.decisions);
        setPolicies(policyRes.policies);
        setConnections(connRes.connections);
        setActivity(actRes.entries);
        setControlSummary(ctrlRes);
      } catch (e) {
        setError(e instanceof Error ? e.message : "API unavailable");
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [config.orchestratorApiUrl]);

  const allowed = controlSummary?.permissionsSummary.allowed ?? 0;
  const denied = controlSummary?.permissionsSummary.denied ?? 0;
  const total = controlSummary?.permissionsSummary.total ?? 0;
  const connectedCount = controlSummary?.connectedAccounts ?? 0;
  const grantCount = controlSummary?.activeGrants ?? 0;
  const activityCount = controlSummary?.recentActivity ?? 0;

  const lastDenied = activity.find((e) => e.allowed === false);

  return (
    <div className="dash-shell">
      <aside className="dash-sidebar">
        <div className="dash-sidebar__brand">
          <span className="dash-sidebar__icon">◆</span>
          <div>
            <div className="dash-sidebar__title">ActBound AI</div>
            <div className="dash-sidebar__subtitle">Zero Trust Engine</div>
          </div>
        </div>

        <nav className="dash-sidebar__nav">
          <button
            className={`dash-nav-item ${section === "dashboard" ? "dash-nav-item--active" : ""}`}
            onClick={() => setSection("dashboard")}
          >
            ▦ Dashboard
          </button>
          <button
            className={`dash-nav-item ${section === "connections" ? "dash-nav-item--active" : ""}`}
            onClick={() => setSection("connections")}
          >
            ⟐ Connected Accounts
          </button>
          <button
            className={`dash-nav-item ${section === "activity" ? "dash-nav-item--active" : ""}`}
            onClick={() => setSection("activity")}
          >
            ☰ Activity Logs
          </button>
          <button
            className={`dash-nav-item ${section === "permissions" ? "dash-nav-item--active" : ""}`}
            onClick={() => setSection("permissions")}
          >
            ◈ Policy Engine
          </button>
          <button
            className={`dash-nav-item ${section === "broker" ? "dash-nav-item--active" : ""}`}
            onClick={() => setSection("broker")}
          >
            ⚿ Token Broker
          </button>
        </nav>

        <div className="dash-sidebar__footer">
          <button className="dash-nav-item" onClick={logout}>
            ↩ Sign Out
          </button>
        </div>
      </aside>

      <main className="dash-main">
        <header className="dash-topbar">
          <div />
          <div className="dash-topbar__user">
            <span>{user?.name ?? user?.email ?? "Operator"}</span>
            <StatusPill tone="success">
              {mode === "auth0" ? "Auth0" : "Demo"}
            </StatusPill>
          </div>
        </header>

        {error && <p className="dash-error">{error}</p>}

        {isLoading ? (
          <p className="dash-loading">Loading dashboard...</p>
        ) : (
          <>
            {section === "dashboard" && (
              <DashboardView
                allowed={allowed}
                denied={denied}
                total={total}
                connectedCount={connectedCount}
                grantCount={grantCount}
                activityCount={activityCount}
                activity={activity}
                lastDenied={lastDenied}
              />
            )}
            {section === "permissions" && (
              <PolicyEngineView policies={policies} decisions={decisions} />
            )}
            {section === "connections" && (
              <ConnectionsView connections={connections} />
            )}
            {section === "activity" && <ActivityView activity={activity} />}
            {section === "broker" && <BrokerView />}
          </>
        )}
      </main>
    </div>
  );
}

function DashboardView({
  allowed,
  denied,
  total,
  connectedCount,
  grantCount,
  activityCount,
  activity,
  lastDenied,
}: {
  allowed: number;
  denied: number;
  total: number;
  connectedCount: number;
  grantCount: number;
  activityCount: number;
  activity: ActivityTimelineEntry[];
  lastDenied?: ActivityTimelineEntry;
}) {
  return (
    <>
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-card__label">Permissions Allowed</div>
          <div className="stat-card__value">{allowed}</div>
          <StatusPill tone="success">{total} total</StatusPill>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Denied Decisions</div>
          <div className="stat-card__value">{denied}</div>
          <StatusPill tone={denied > 0 ? "warning" : "success"}>
            {denied === 0 ? "Clean" : "Review"}
          </StatusPill>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Connected Accounts</div>
          <div className="stat-card__value">{connectedCount}</div>
          <StatusPill tone="neutral">{grantCount} grants</StatusPill>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Audit Events</div>
          <div className="stat-card__value">{activityCount}</div>
          <StatusPill tone="success">Tracked</StatusPill>
        </div>
      </div>

      <div className="dash-grid">
        <section className="dash-panel dash-panel--wide">
          <div className="dash-panel__header">
            <h2>Real-time Authorization Feed</h2>
            <span className="dash-panel__subtitle">
              Live stream of authorization decisions
            </span>
          </div>
          <div className="auth-feed">
            {activity.slice(0, 8).map((entry) => (
              <div key={entry.id} className="auth-feed__item">
                <div className="auth-feed__left">
                  <strong>{entry.eventType}</strong>
                  <StatusPill
                    tone={entry.allowed === false ? "warning" : "success"}
                  >
                    {entry.allowed === false ? "Denied" : "Allowed"}
                  </StatusPill>
                </div>
                <div className="auth-feed__detail">{entry.summary}</div>
                <div className="auth-feed__meta">
                  {entry.resource?.label ?? entry.resource?.type ?? ""}
                  {entry.onBehalfOf
                    ? ` · on behalf of ${entry.onBehalfOf}`
                    : ""}
                </div>
                <div className="auth-feed__time">
                  {new Date(entry.occurredAt).toLocaleTimeString()}
                  {entry.stepUpRequired ? " · STEP_UP" : ""}
                </div>
              </div>
            ))}
            {activity.length === 0 && (
              <p className="empty-state">No activity recorded yet.</p>
            )}
          </div>
        </section>

        <section className="dash-panel">
          <div className="dash-panel__header">
            <h2>Zero Trust Health</h2>
          </div>
          <div className="health-score">
            <div className="health-score__value">
              {total > 0 ? Math.round((allowed / total) * 100) : 0}%
            </div>
            <p className="health-score__label">Permission Compliance</p>
            <div className="health-bar">
              <div
                className="health-bar__fill"
                style={{ width: `${total > 0 ? (allowed / total) * 100 : 0}%` }}
              />
            </div>
          </div>

          {lastDenied && (
            <div className="policy-reason">
              <div className="policy-reason__label">Last Denial</div>
              <div className="policy-reason__event">{lastDenied.eventType}</div>
              <div className="policy-reason__summary">{lastDenied.summary}</div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function PolicyEngineView({
  policies,
  decisions,
}: {
  policies: PolicyView[];
  decisions: PermissionDecisionRecord[];
}) {
  const [filter, setFilter] = useState("");

  const filtered = policies.filter(
    (p) =>
      !filter ||
      p.permission.toLowerCase().includes(filter.toLowerCase()) ||
      p.resource.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <>
      <div className="dash-panel__header" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.6rem", margin: 0 }}>Policy Engine</h2>
        <span className="dash-panel__subtitle">
          Orchestrate and enforce zero-trust autonomous agent boundaries.
        </span>
      </div>

      <div style={{ marginBottom: "1.25rem" }}>
        <input
          type="text"
          placeholder="Search policies..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="login-field__input"
          style={{
            width: "100%",
            maxWidth: 400,
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "0.6rem 0.85rem",
            background: "var(--card)",
          }}
        />
      </div>

      <div className="policy-list">
        {filtered.map((policy) => {
          const decision = decisions.find(
            (d) => d.permission === policy.permission,
          );

          return (
            <div key={policy.permission} className="policy-card">
              <div className="policy-card__header">
                <div>
                  <strong className="policy-card__name">
                    {policy.permission.replace(":", " → ")}
                  </strong>
                  <p className="policy-card__desc">{policy.description}</p>
                </div>
                <div className="policy-card__badges">
                  <StatusPill tone="success">Active</StatusPill>
                  {decision && (
                    <StatusPill tone={decision.allowed ? "success" : "warning"}>
                      {decision.allowed
                        ? "Currently Allowed"
                        : "Currently Denied"}
                    </StatusPill>
                  )}
                </div>
              </div>

              <div className="policy-card__meta">
                <div>
                  <span className="policy-card__label">Target</span>
                  <span>{policy.target}</span>
                </div>
                <div>
                  <span className="policy-card__label">Roles</span>
                  <span>{policy.roles.join(", ")}</span>
                </div>
              </div>

              <div className="policy-card__rule">
                <span className="policy-card__label">Rule Logic</span>
                <div className="rule-logic">
                  {policy.conditions.map((c, i) => (
                    <span key={i} className="rule-pill">
                      {i > 0 && <span className="rule-pill__op">AND</span>}
                      <span className="rule-pill__field">{c.field}</span>
                      <span className="rule-pill__operator">{c.operator}</span>
                      <span className="rule-pill__value">{c.value}</span>
                    </span>
                  ))}
                  <span className="rule-pill rule-pill--action">
                    THEN ALLOW
                  </span>
                </div>
              </div>

              {policy.flags.length > 0 && (
                <div className="policy-card__flags">
                  {policy.flags.map((flag) => (
                    <span key={flag} className="policy-flag">
                      {flag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function ConnectionsView({
  connections,
}: {
  connections: ProviderConnection[];
}) {
  return (
    <section className="dash-panel">
      <div className="dash-panel__header">
        <h2>Connected Accounts</h2>
        <span className="dash-panel__subtitle">
          Delegated provider connections via Auth0 Token Vault
        </span>
      </div>
      <div className="conn-list">
        {connections.map((conn) => (
          <div key={conn.id} className="conn-card">
            <div className="conn-card__header">
              <strong>{conn.provider}</strong>
              <StatusPill
                tone={conn.status === "connected" ? "success" : "warning"}
              >
                {conn.status}
              </StatusPill>
            </div>
            <div className="conn-card__label">{conn.accountLabel}</div>
            <div className="conn-card__scopes">
              {conn.grantedScopes.join(", ")}
            </div>
          </div>
        ))}
        {connections.length === 0 && (
          <p className="empty-state">No connected accounts.</p>
        )}
      </div>
    </section>
  );
}

function ActivityView({ activity }: { activity: ActivityTimelineEntry[] }) {
  return (
    <section className="dash-panel">
      <div className="dash-panel__header">
        <h2>Activity Logs</h2>
        <span className="dash-panel__subtitle">
          Authorization decisions, agent actions, and broker events
        </span>
      </div>
      <div className="auth-feed">
        {activity.map((entry) => (
          <div key={entry.id} className="auth-feed__item">
            <div className="auth-feed__left">
              <strong>{entry.eventType}</strong>
              <StatusPill
                tone={entry.allowed === false ? "warning" : "success"}
              >
                {entry.allowed === false ? "Denied" : "Allowed"}
              </StatusPill>
            </div>
            <div className="auth-feed__detail">{entry.summary}</div>
            <div className="auth-feed__meta">
              {entry.resource?.type}
              {entry.resource?.label ? `: ${entry.resource.label}` : ""}
              {entry.onBehalfOf ? ` · on behalf of ${entry.onBehalfOf}` : ""}
            </div>
            <div className="auth-feed__time">
              {new Date(entry.occurredAt).toLocaleTimeString()}
              {entry.stepUpRequired ? " · STEP_UP_REQUIRED" : ""}
            </div>
          </div>
        ))}
        {activity.length === 0 && (
          <p className="empty-state">No activity recorded yet.</p>
        )}
      </div>
    </section>
  );
}

function BrokerView() {
  return (
    <section className="dash-panel">
      <div className="dash-panel__header">
        <h2>Token Broker</h2>
        <span className="dash-panel__subtitle">
          Cache-first M2M and delegated token brokerage
        </span>
      </div>
      <p className="empty-state">
        Token broker controls will be available in the full dashboard. Use the
        API directly at <code>POST /token-broker/preview</code> and{" "}
        <code>POST /token-broker/retrieve</code>.
      </p>
    </section>
  );
}
