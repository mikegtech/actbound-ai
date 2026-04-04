import { useEffect, useEffectEvent, useState } from "react";
import type {
  ActivityTimelineEntry,
  AgentActionExecuteResult,
  AgentActionPreviewResult,
  BrokeredTokenResponse,
  ConsentPreviewResult,
  ConsentSummary,
  PermissionContextSummary,
  PermissionDecisionRecord,
  ProviderConnection,
  ScopedTokenRequest,
  TokenBrokerPreviewResult,
  TokenBrokerStatus,
  TokenCacheSummary,
  UserControlSummary,
  VaultSession,
} from "@actbound/sdk";
import { OrchestratorApiClient } from "@actbound/sdk";
import { Panel, PermissionDecisionList, StatusPill } from "@actbound/ui";

const orchestratorClient = new OrchestratorApiClient(
  import.meta.env.VITE_ORCHESTRATOR_API_URL ?? "http://localhost:3001",
);

export function App() {
  const [permissionContext, setPermissionContext] =
    useState<PermissionContextSummary | null>(null);
  const [decisions, setDecisions] = useState<PermissionDecisionRecord[]>([]);
  const [providerConnections, setProviderConnections] = useState<
    ProviderConnection[]
  >([]);
  const [consents, setConsents] = useState<ConsentSummary[]>([]);
  const [vaultSessions, setVaultSessions] = useState<VaultSession[]>([]);
  const [consentPreview, setConsentPreview] =
    useState<ConsentPreviewResult | null>(null);
  const [previewResult, setPreviewResult] =
    useState<AgentActionPreviewResult | null>(null);
  const [executeResult, setExecuteResult] =
    useState<AgentActionExecuteResult | null>(null);
  const [tokenBrokerStatus, setTokenBrokerStatus] =
    useState<TokenBrokerStatus | null>(null);
  const [tokenCacheSummary, setTokenCacheSummary] =
    useState<TokenCacheSummary | null>(null);
  const [tokenPreview, setTokenPreview] =
    useState<TokenBrokerPreviewResult | null>(null);
  const [brokeredToken, setBrokeredToken] =
    useState<BrokeredTokenResponse | null>(null);
  const [activityTimeline, setActivityTimeline] = useState<
    ActivityTimelineEntry[]
  >([]);
  const [controlSummary, setControlSummary] =
    useState<UserControlSummary | null>(null);
  const [delegatedFeedback, setDelegatedFeedback] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = useEffectEvent(async () => {
    setIsLoading(true);
    setError("");

    try {
      const [
        permissionResponse,
        providerConnectionResponse,
        consentResponse,
        vaultSessionResponse,
        brokerStatusResponse,
        brokerCacheResponse,
        activityResponse,
        controlSummaryResponse,
      ] = await Promise.all([
        orchestratorClient.getMePermissions(),
        orchestratorClient.getConnections(),
        orchestratorClient.getConsents(),
        orchestratorClient.getVaultSessions(),
        orchestratorClient.getTokenBrokerStatus(),
        orchestratorClient.getTokenBrokerCache(),
        orchestratorClient.getMeActivity(),
        orchestratorClient.getMeControlSummary(),
      ]);

      setPermissionContext(permissionResponse.context);
      setDecisions(permissionResponse.decisions);
      setProviderConnections(providerConnectionResponse.connections);
      setConsents(consentResponse.consents);
      setVaultSessions(vaultSessionResponse.sessions);
      setTokenBrokerStatus(brokerStatusResponse);
      setTokenCacheSummary(brokerCacheResponse);
      setActivityTimeline(activityResponse.entries);
      setControlSummary(controlSummaryResponse);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to reach the orchestrator API.",
      );
    } finally {
      setIsLoading(false);
    }
  });

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const selectedConnection = providerConnections[0];
  const selectedConsent =
    consents.find(
      (consent) => consent.connectionId === selectedConnection?.id,
    ) ?? consents[0];
  const selectedVaultSession =
    vaultSessions.find(
      (session) => session.connectionId === selectedConnection?.id,
    ) ?? vaultSessions[0];
  const selectedConnectionId =
    selectedConnection?.id ??
    permissionContext?.providerConnection.connectionId ??
    "conn_demo_salesforce";

  const previewDecision = decisions.find(
    (decision) => decision.permission === "agent_actions:preview",
  );
  const executeDecision = decisions.find(
    (decision) => decision.permission === "agent_actions:execute",
  );
  const tokenBrokerReadDecision = decisions.find(
    (decision) => decision.permission === "brokered_tokens:read",
  );
  const tokenBrokerIssueDecision = decisions.find(
    (decision) => decision.permission === "brokered_tokens:broker",
  );
  const tokenBrokerReuseDecision = decisions.find(
    (decision) => decision.permission === "brokered_tokens:reuse",
  );
  const delegatedTokenDecision = decisions.find(
    (decision) => decision.permission === "delegated_tokens:use",
  );
  const tokenCacheInspectDecision = decisions.find(
    (decision) => decision.permission === "token_cache:inspect",
  );
  const connectDecision = decisions.find(
    (decision) => decision.permission === "provider_connections:connect",
  );
  const revokeDecision = decisions.find(
    (decision) => decision.permission === "provider_connections:revoke",
  );
  const consentPreviewDecision = decisions.find(
    (decision) => decision.permission === "delegated_grants:preview",
  );
  const sensitiveActionDecision = decisions.find(
    (decision) => decision.permission === "sensitive_actions:execute",
  );

  function buildBrokerRequest(): ScopedTokenRequest {
    return {
      audience: permissionContext?.attributes.tokenAudience ?? "agent-service",
      scopes: ["valuations.execute"],
      purpose:
        "Broker a delegated valuation token for a protected placeholder flow",
      intent: selectedConsent?.status === "granted" ? "delegated" : "m2m",
      actorId: permissionContext?.actor.id,
      subjectId: permissionContext?.subject.id,
      connectionId: selectedConnectionId,
      consentGrantId: selectedConsent?.id ?? permissionContext?.consent.grantId,
      sensitiveActionClassification:
        consentPreview?.consent.sensitiveActionClassification ?? "sensitive",
    };
  }

  async function handlePreview() {
    setPreviewResult(null);
    setExecuteResult(null);
    setError("");

    try {
      const result = await orchestratorClient.previewAgentAction({
        action: "valuation.reconcile",
        connectionId: selectedConnectionId,
        consentGrantId:
          selectedConsent?.id ?? permissionContext?.consent.grantId,
        payload: {
          listingId: "listing_demo_001",
        },
      });

      setPreviewResult(result);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to preview agent action.",
      );
    }
  }

  async function handleExecute() {
    setPreviewResult(null);
    setExecuteResult(null);
    setError("");

    try {
      const result = await orchestratorClient.executeAgentAction({
        action: "valuation.reconcile",
        connectionId: selectedConnectionId,
        consentGrantId:
          selectedConsent?.id ?? permissionContext?.consent.grantId,
        payload: {
          listingId: "listing_demo_001",
        },
      });

      setExecuteResult(result);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to execute agent action.",
      );
    }
  }

  async function handleConnectProvider() {
    setDelegatedFeedback("");
    setError("");

    try {
      const result = await orchestratorClient.connectProvider({
        provider: "salesforce",
        accountLabel: "Acme Realty CRM",
        requestedScopes: [
          "agent.preview",
          "agent.execute",
          "tokens.delegated",
          "sensitive.execute",
        ],
        purpose: "Enable delegated CRM workflows for ActBound AI",
        sensitiveActionClassification: "sensitive",
      });

      setDelegatedFeedback(result.summary);
      await loadDashboard();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create the provider connection placeholder.",
      );
    }
  }

  async function handleRevokeConnection() {
    if (!selectedConnection) {
      return;
    }

    setDelegatedFeedback("");
    setError("");

    try {
      const result = await orchestratorClient.revokeConnection(
        selectedConnection.id,
        {
          reason:
            "User requested delegated-access disconnect from the demo UI.",
          revokeGrants: true,
        },
      );

      setDelegatedFeedback(result.summary);
      await loadDashboard();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to revoke delegated access.",
      );
    }
  }

  async function handleConsentPreview() {
    setConsentPreview(null);
    setDelegatedFeedback("");
    setError("");

    try {
      const result = await orchestratorClient.previewConsent({
        provider: selectedConnection?.provider ?? "salesforce",
        connectionId: selectedConnection?.id,
        requestedScopes: [
          "agent.execute",
          "tokens.delegated",
          "sensitive.execute",
        ],
        actionLabel: "valuation.reconcile",
        sensitiveActionClassification: "sensitive",
      });

      setConsentPreview(result);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to preview delegated consent.",
      );
    }
  }

  async function handleTokenPreview() {
    setTokenPreview(null);
    setBrokeredToken(null);
    setError("");

    try {
      const result =
        await orchestratorClient.previewBrokeredToken(buildBrokerRequest());

      setTokenPreview(result);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to preview token broker request.",
      );
    }
  }

  async function handleTokenRetrieve() {
    setTokenPreview(null);
    setBrokeredToken(null);
    setError("");

    try {
      const result =
        await orchestratorClient.retrieveBrokeredToken(buildBrokerRequest());

      setBrokeredToken(result);
      await loadDashboard();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to retrieve brokered token metadata.",
      );
    }
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="hero__eyebrow">ActBound AI</p>
        <h1>Delegated access stays backend-issued and inspectable.</h1>
        <p className="hero__copy">
          The orchestrator resolves connection state, consent summaries, vault
          session metadata, and token-broker responses. The UI only renders what
          the backend already decided.
        </p>
        <div className="hero__status-row">
          <StatusPill tone={isLoading ? "neutral" : "success"}>
            {isLoading ? "Loading decisions" : "Permissions loaded"}
          </StatusPill>
          <StatusPill
            tone={providerConnections.length > 0 ? "success" : "warning"}
          >
            {providerConnections.length > 0
              ? "Delegated provider connected"
              : "No delegated provider"}
          </StatusPill>
          <StatusPill
            tone={consentPreview?.stepUpRequired ? "warning" : "neutral"}
          >
            {consentPreview?.stepUpRequired
              ? "Step-up preview required"
              : "Step-up preview idle"}
          </StatusPill>
        </div>
      </section>

      <section className="grid">
        <Panel
          eyebrow="Permissions"
          title="Resolved backend decisions"
          footer={
            error ? (
              <p className="feedback feedback--error">{error}</p>
            ) : (
              <p className="feedback">
                The UI renders these decisions directly and does not evaluate
                policy rules.
              </p>
            )
          }
        >
          {decisions.length > 0 ? (
            <PermissionDecisionList decisions={decisions} />
          ) : (
            <p className="empty-state">
              Start the orchestrator API on port 3001 to load permission
              decisions.
            </p>
          )}
        </Panel>

        <Panel eyebrow="Context" title="Centralized permission context">
          {permissionContext ? (
            <div className="context-grid">
              <div className="context-card">
                <strong>Actor</strong>
                <p>
                  {permissionContext.actor.id} / {permissionContext.actor.type}
                </p>
                <p>{permissionContext.actor.roles.join(", ")}</p>
              </div>
              <div className="context-card">
                <strong>Consent</strong>
                <p>{permissionContext.consent.status}</p>
                <p>
                  {permissionContext.consent.scopes.join(", ") || "No scopes"}
                </p>
              </div>
              <div className="context-card">
                <strong>Provider connection</strong>
                <p>{permissionContext.providerConnection.status}</p>
                <p>
                  {permissionContext.providerConnection.provider ??
                    "Provider pending"}
                </p>
              </div>
              <div className="context-card">
                <strong>Vault session</strong>
                <p>{permissionContext.vaultSession.status}</p>
                <p>
                  {permissionContext.attributes.stepUpSatisfied
                    ? "Step-up satisfied"
                    : "Step-up not satisfied"}
                </p>
              </div>
            </div>
          ) : (
            <p className="empty-state">
              Permission context appears after the backend resolves the request.
            </p>
          )}
        </Panel>

        <Panel
          eyebrow="Delegated Access"
          title="Connected accounts and consent"
        >
          <div className="hero__status-row">
            <StatusPill tone={connectDecision?.allowed ? "success" : "warning"}>
              {connectDecision?.allowed
                ? "Connect allowed"
                : "Connect restricted"}
            </StatusPill>
            <StatusPill
              tone={consentPreviewDecision?.allowed ? "success" : "warning"}
            >
              {consentPreviewDecision?.allowed
                ? "Consent preview allowed"
                : "Consent preview restricted"}
            </StatusPill>
            <StatusPill tone={revokeDecision?.allowed ? "success" : "warning"}>
              {revokeDecision?.allowed ? "Revoke allowed" : "Revoke restricted"}
            </StatusPill>
          </div>

          <div className="action-stack">
            <button
              disabled={!(connectDecision?.allowed ?? false)}
              onClick={() => void handleConnectProvider()}
              type="button"
            >
              Connect provider placeholder
            </button>
            <button
              disabled={!(consentPreviewDecision?.allowed ?? false)}
              onClick={() => void handleConsentPreview()}
              type="button"
            >
              Preview consent and step-up
            </button>
            <button
              disabled={
                !(revokeDecision?.allowed ?? false) || !selectedConnection
              }
              onClick={() => void handleRevokeConnection()}
              type="button"
            >
              Revoke access placeholder
            </button>
          </div>

          {delegatedFeedback ? (
            <p className="feedback">{delegatedFeedback}</p>
          ) : null}

          <div className="subpanel-grid">
            <section className="subpanel">
              <h3>Providers</h3>
              <div className="connection-list">
                {providerConnections.map((connection) => (
                  <article key={connection.id} className="connection-card">
                    <div className="connection-card__header">
                      <strong>{connection.accountLabel}</strong>
                      <StatusPill
                        tone={
                          connection.status === "connected"
                            ? "success"
                            : "warning"
                        }
                      >
                        {connection.status}
                      </StatusPill>
                    </div>
                    <p>{connection.provider}</p>
                    <p>lifecycle {connection.grantLifecycleState}</p>
                    <p className="connection-card__scopes">
                      {connection.grantedScopes.join(", ")}
                    </p>
                  </article>
                ))}
                {providerConnections.length === 0 ? (
                  <p className="empty-state">
                    No delegated provider connections are currently available.
                  </p>
                ) : null}
              </div>
            </section>

            <section className="subpanel">
              <h3>Consents</h3>
              <div className="connection-list">
                {consents.map((consent) => (
                  <article key={consent.id} className="connection-card">
                    <div className="connection-card__header">
                      <strong>{consent.provider}</strong>
                      <StatusPill
                        tone={
                          consent.status === "granted" ? "success" : "warning"
                        }
                      >
                        {consent.status}
                      </StatusPill>
                    </div>
                    <p>{consent.summary}</p>
                    <p className="connection-card__scopes">
                      {consent.scopes.join(", ")}
                    </p>
                  </article>
                ))}
                {consents.length === 0 ? (
                  <p className="empty-state">
                    No delegated consent summaries are available yet.
                  </p>
                ) : null}
              </div>
            </section>

            <section className="subpanel">
              <h3>Vault sessions</h3>
              <div className="connection-list">
                {vaultSessions.map((session) => (
                  <article key={session.id} className="connection-card">
                    <div className="connection-card__header">
                      <strong>{session.provider}</strong>
                      <StatusPill
                        tone={
                          session.status === "active" ? "success" : "warning"
                        }
                      >
                        {session.status}
                      </StatusPill>
                    </div>
                    <p>{session.tokenReference}</p>
                    <p className="connection-card__scopes">
                      {session.scopes.join(", ")}
                    </p>
                  </article>
                ))}
                {vaultSessions.length === 0 ? (
                  <p className="empty-state">
                    No delegated vault sessions are available yet.
                  </p>
                ) : null}
              </div>
            </section>
          </div>

          {consentPreview ? (
            <div className="feedback-block">
              <p className="feedback">{consentPreview.summary}</p>
              <p className="feedback feedback--muted">
                consent {consentPreview.consent.status} / step-up{" "}
                {consentPreview.stepUpRequired ? "required" : "not required"} /
                classification{" "}
                {consentPreview.consent.sensitiveActionClassification}
              </p>
              <p className="feedback feedback--muted">
                {consentPreview.sensitiveActionDecision?.reasons
                  .map((reason) => `${reason.code}: ${reason.message}`)
                  .join(" ")}
              </p>
            </div>
          ) : (
            <p className="empty-state">
              Run the consent preview to inspect delegated grant shape and
              step-up requirements for a sensitive action.
            </p>
          )}
        </Panel>

        <Panel
          eyebrow="Token Broker"
          title="Cache-first broker with delegated context"
        >
          <div className="hero__status-row">
            <StatusPill
              tone={
                tokenBrokerStatus?.cache.backend === "redis"
                  ? "success"
                  : "neutral"
              }
            >
              {tokenBrokerStatus
                ? `${tokenBrokerStatus.cache.backend} cache`
                : "Broker status unavailable"}
            </StatusPill>
            <StatusPill
              tone={tokenCacheInspectDecision?.allowed ? "success" : "warning"}
            >
              {tokenCacheInspectDecision?.allowed
                ? "Cache inspection allowed"
                : "Cache inspection restricted"}
            </StatusPill>
            <StatusPill
              tone={sensitiveActionDecision?.allowed ? "success" : "warning"}
            >
              {sensitiveActionDecision?.allowed
                ? "Sensitive execution allowed"
                : "Sensitive execution gated"}
            </StatusPill>
          </div>

          {tokenBrokerStatus ? (
            <div className="context-grid">
              <div className="context-card">
                <strong>Broker status</strong>
                <p>{tokenBrokerStatus.status}</p>
                <p>
                  hits {tokenBrokerStatus.cache.hits} / misses{" "}
                  {tokenBrokerStatus.cache.misses}
                </p>
              </div>
              <div className="context-card">
                <strong>Cache</strong>
                <p>{tokenBrokerStatus.cache.entryCount} entries</p>
                <p>
                  {tokenBrokerStatus.cache.fallbackInUse
                    ? "In-memory fallback active"
                    : "Redis active"}
                </p>
              </div>
              <div className="context-card">
                <strong>Delegated path</strong>
                <p>{tokenBrokerStatus.integrations.delegated}</p>
                <p>
                  {selectedVaultSession?.tokenReference ?? "No vault session"}
                </p>
              </div>
            </div>
          ) : (
            <p className="empty-state">
              Token broker status appears after the backend responds.
            </p>
          )}

          <div className="action-stack">
            <button
              disabled={!(tokenBrokerReadDecision?.allowed ?? false)}
              onClick={() => void handleTokenPreview()}
              type="button"
            >
              Preview broker request
            </button>
            <button
              disabled={
                !(
                  tokenBrokerIssueDecision?.allowed ||
                  tokenBrokerReuseDecision?.allowed ||
                  delegatedTokenDecision?.allowed
                )
              }
              onClick={() => void handleTokenRetrieve()}
              type="button"
            >
              Retrieve brokered token metadata
            </button>
          </div>

          {tokenPreview ? (
            <div className="feedback-block">
              <p className="feedback">{tokenPreview.summary}</p>
              <p className="feedback feedback--muted">
                cache {tokenPreview.cacheHit ? "hit" : "miss"} / backend{" "}
                {tokenPreview.cache.backend} / permission{" "}
                {tokenPreview.permissionDecision.permission}
              </p>
              <p className="feedback feedback--muted">
                step-up{" "}
                {tokenPreview.stepUpRequired
                  ? "required later"
                  : "not required"}{" "}
                / intent {tokenPreview.request.intent}
              </p>
            </div>
          ) : null}

          {brokeredToken ? (
            <article className="connection-card">
              <div className="connection-card__header">
                <strong>{brokeredToken.metadata.source}</strong>
                <StatusPill
                  tone={brokeredToken.metadata.cacheHit ? "success" : "neutral"}
                >
                  {brokeredToken.metadata.cacheHit ? "Cache hit" : "Cache miss"}
                </StatusPill>
              </div>
              <p>Source type: {brokeredToken.metadata.sourceType}</p>
              <p>Provider: {brokeredToken.metadata.provider ?? "m2m path"}</p>
              <p>Audience: {brokeredToken.metadata.audience}</p>
              <p className="connection-card__scopes">
                {brokeredToken.metadata.scopes.join(", ")}
              </p>
              <p>
                Session:{" "}
                {brokeredToken.metadata.vaultSessionId ??
                  brokeredToken.metadata.vaultTokenReference ??
                  "No delegated vault session"}
              </p>
              <p>
                Expires:{" "}
                {new Date(brokeredToken.metadata.expiresAt).toLocaleString()}
              </p>
            </article>
          ) : null}

          {tokenCacheSummary?.entries.length ? (
            <div className="token-cache-list">
              {tokenCacheSummary.entries.map((entry) => (
                <article key={entry.cacheKey} className="connection-card">
                  <div className="connection-card__header">
                    <strong>{entry.source}</strong>
                    <StatusPill tone="neutral">
                      {entry.hitCount} hits
                    </StatusPill>
                  </div>
                  <p>{entry.provider ?? entry.audience}</p>
                  <p className="connection-card__scopes">
                    {entry.scopes.join(", ")}
                  </p>
                  <p>
                    intent {entry.intent} / classification{" "}
                    {entry.sensitiveActionClassification ?? "routine"}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-state">
              Broker cache entries will appear after the first token retrieval.
            </p>
          )}
        </Panel>

        <Panel eyebrow="Actions" title="Operator workflow">
          <div className="action-stack">
            <button
              disabled={!(previewDecision?.allowed ?? false)}
              onClick={() => void handlePreview()}
              type="button"
            >
              Preview agent action
            </button>
            <button
              disabled={!(executeDecision?.allowed ?? false)}
              onClick={() => void handleExecute()}
              type="button"
            >
              Execute agent action
            </button>
          </div>
          {previewResult ? (
            <div className="feedback-block">
              <p className="feedback">{previewResult.summary}</p>
              <p className="feedback feedback--muted">
                {previewResult.permissionDecision.reasons
                  .map((reason) => `${reason.code}: ${reason.message}`)
                  .join(" ")}
              </p>
            </div>
          ) : null}
          {executeResult ? (
            <div className="feedback-block">
              <p className="feedback">
                {executeResult.status}:{" "}
                {executeResult.permissionDecision.reasons
                  .map((reason) => reason.message)
                  .join(" ")}
              </p>
              <p className="feedback feedback--muted">
                {executeResult.permissionDecision.reasons
                  .map((reason) => reason.code)
                  .join(", ")}
              </p>
            </div>
          ) : null}
        </Panel>
      </section>

      <section className="grid">
        <Panel
          eyebrow="User Control"
          title="Your access dashboard"
          footer={
            <p className="feedback">
              All metrics are computed by the backend. The UI only renders what
              it receives.
            </p>
          }
        >
          {controlSummary ? (
            <div className="context-grid">
              <div className="context-card">
                <strong>Permissions</strong>
                <p>
                  {controlSummary.permissionsSummary.allowed} /{" "}
                  {controlSummary.permissionsSummary.total} allowed
                </p>
                <StatusPill
                  tone={
                    controlSummary.permissionsSummary.denied === 0
                      ? "success"
                      : "warning"
                  }
                >
                  {controlSummary.permissionsSummary.denied} denied
                </StatusPill>
              </div>
              <div className="context-card">
                <strong>Connected Accounts</strong>
                <p>{controlSummary.connectedAccounts} active</p>
              </div>
              <div className="context-card">
                <strong>Active Grants</strong>
                <p>{controlSummary.activeGrants} grants</p>
              </div>
              <div className="context-card">
                <strong>Activity</strong>
                <p>{controlSummary.recentActivity} events</p>
                <p>{controlSummary.revocations} revocations</p>
              </div>
            </div>
          ) : (
            <p className="empty-state">Loading control summary...</p>
          )}
        </Panel>

        <Panel
          eyebrow="Activity Timeline"
          title="Recent actions and decisions"
          footer={
            <p className="feedback">
              Shows actions by you and agents acting on your behalf, with
              authorization decisions and step-up indicators.
            </p>
          }
        >
          {activityTimeline.length > 0 ? (
            <div className="audit-timeline">
              {activityTimeline.map((entry) => (
                <div key={entry.id} className="audit-entry">
                  <div className="audit-entry__header">
                    <StatusPill
                      tone={
                        entry.allowed === false
                          ? "warning"
                          : entry.stepUpRequired
                            ? "warning"
                            : "success"
                      }
                    >
                      {entry.allowed === false
                        ? "denied"
                        : entry.stepUpRequired
                          ? "step-up"
                          : "allowed"}
                    </StatusPill>
                    <span className="audit-entry__type">{entry.eventType}</span>
                    <span className="audit-entry__time">
                      {new Date(entry.occurredAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="audit-entry__summary">{entry.summary}</p>
                  {entry.resource ? (
                    <p className="audit-entry__resource">
                      {entry.resource.type}
                      {entry.resource.label ? `: ${entry.resource.label}` : ""}
                    </p>
                  ) : null}
                  {entry.onBehalfOf ? (
                    <p className="audit-entry__delegation">
                      On behalf of: {entry.onBehalfOf}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">
              No activity recorded yet. Interact with the dashboard to generate
              events.
            </p>
          )}
        </Panel>
      </section>
    </main>
  );
}
