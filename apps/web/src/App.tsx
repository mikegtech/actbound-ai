import { useEffect, useState } from "react";
import type {
  AgentActionExecuteResult,
  AgentActionPreviewResult,
  BrokeredTokenResponse,
  PermissionContextSummary,
  PermissionDecisionRecord,
  ScopedTokenRequest,
  TokenBrokerPreviewResult,
  TokenBrokerStatus,
  TokenCacheSummary,
  VaultConnection,
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
  const [connections, setConnections] = useState<VaultConnection[]>([]);
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
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      setError("");

      try {
        const [
          permissionResponse,
          connectionResponse,
          brokerStatusResponse,
          brokerCacheResponse,
        ] = await Promise.all([
          orchestratorClient.getMePermissions(),
          orchestratorClient.getMeConnections(),
          orchestratorClient.getTokenBrokerStatus(),
          orchestratorClient.getTokenBrokerCache(),
        ]);

        if (!active) {
          return;
        }

        setPermissionContext(permissionResponse.context);
        setDecisions(permissionResponse.decisions);
        setConnections(connectionResponse.connections);
        setTokenBrokerStatus(brokerStatusResponse);
        setTokenCacheSummary(brokerCacheResponse);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to reach the orchestrator API.",
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const selectedConnectionId = connections[0]?.id ?? "conn_demo_vault";

  const previewDecision = decisions.find(
    (decision) => decision.permission === "agent_actions:preview",
  );
  const executeDecision = decisions.find(
    (decision) => decision.permission === "agent_actions:execute",
  );
  const actionAvailability = {
    canPreview: previewDecision?.allowed ?? false,
    canExecute: executeDecision?.allowed ?? false,
  };
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

  function buildBrokerRequest(): ScopedTokenRequest {
    return {
      audience: permissionContext?.attributes.tokenAudience ?? "agent-service",
      scopes: ["valuations.execute"],
      purpose: "Broker a valuation token for a protected placeholder flow",
      intent:
        permissionContext?.consent.status === "granted" ? "delegated" : "m2m",
      actorId: permissionContext?.actor.id,
      subjectId: permissionContext?.subject.id,
      connectionId: selectedConnectionId,
      consentGrantId: permissionContext?.consent.grantId,
    };
  }

  async function refreshTokenBrokerPanels() {
    const [brokerStatusResponse, brokerCacheResponse] = await Promise.all([
      orchestratorClient.getTokenBrokerStatus(),
      orchestratorClient.getTokenBrokerCache(),
    ]);

    setTokenBrokerStatus(brokerStatusResponse);
    setTokenCacheSummary(brokerCacheResponse);
  }

  async function handlePreview() {
    setPreviewResult(null);
    setExecuteResult(null);
    setError("");

    try {
      const result = await orchestratorClient.previewAgentAction({
        action: "valuation.reconcile",
        connectionId: selectedConnectionId,
        consentGrantId: permissionContext?.consent.grantId,
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
        consentGrantId: permissionContext?.consent.grantId,
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
      await refreshTokenBrokerPanels();
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
        <h1>Backend-issued permissions drive the UI.</h1>
        <p className="hero__copy">
          The web app reads permission decisions from the orchestrator service,
          shows connection state, and only enables actions that the backend
          already resolved.
        </p>
        <div className="hero__status-row">
          <StatusPill tone={isLoading ? "neutral" : "success"}>
            {isLoading ? "Loading decisions" : "Permissions loaded"}
          </StatusPill>
          <StatusPill tone={connections.length > 0 ? "success" : "warning"}>
            {connections.length > 0 ? "Vault connected" : "No connections"}
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
                <strong>Token Vault</strong>
                <p>{permissionContext.tokenVaultConnection.status}</p>
                <p>
                  {permissionContext.tokenVaultConnection.scopes.join(", ") ||
                    "No scopes"}
                </p>
              </div>
            </div>
          ) : (
            <p className="empty-state">
              Permission context appears after the backend resolves the request.
            </p>
          )}
        </Panel>

        <Panel eyebrow="Connections" title="Consent and vault context">
          <div className="connection-list">
            {connections.map((connection) => (
              <article key={connection.id} className="connection-card">
                <div className="connection-card__header">
                  <strong>{connection.accountLabel}</strong>
                  <StatusPill
                    tone={
                      connection.status === "connected" ? "success" : "warning"
                    }
                  >
                    {connection.status}
                  </StatusPill>
                </div>
                <p>{connection.provider}</p>
                <p className="connection-card__scopes">
                  {connection.scopes.join(", ")}
                </p>
              </article>
            ))}
            {connections.length === 0 ? (
              <p className="empty-state">
                No backend connection data available yet.
              </p>
            ) : null}
          </div>
        </Panel>

        <Panel eyebrow="Token Broker" title="Cache-first token broker">
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
                <strong>Supported intents</strong>
                <p>{tokenBrokerStatus.supportedIntents.join(", ")}</p>
                <p>{tokenBrokerStatus.integrations.delegated}</p>
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
              <p>Audience: {brokeredToken.metadata.audience}</p>
              <p className="connection-card__scopes">
                {brokeredToken.metadata.scopes.join(", ")}
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
                  <p>{entry.audience}</p>
                  <p className="connection-card__scopes">
                    {entry.scopes.join(", ")}
                  </p>
                  <p>
                    intent {entry.intent} / expires{" "}
                    {new Date(entry.expiresAt).toLocaleString()}
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
              disabled={!actionAvailability.canPreview}
              onClick={() => void handlePreview()}
              type="button"
            >
              Preview agent action
            </button>
            <button
              disabled={!actionAvailability.canExecute}
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
    </main>
  );
}
