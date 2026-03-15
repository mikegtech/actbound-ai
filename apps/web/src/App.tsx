import { useEffect, useState } from "react";
import type { PermissionDecisionRecord, VaultConnection } from "@actbound/sdk";
import { OrchestratorApiClient } from "@actbound/sdk";
import { Panel, PermissionDecisionList, StatusPill } from "@actbound/ui";

const orchestratorClient = new OrchestratorApiClient(
  import.meta.env.VITE_ORCHESTRATOR_API_URL ?? "http://localhost:3001",
);

export function App() {
  const [decisions, setDecisions] = useState<PermissionDecisionRecord[]>([]);
  const [connections, setConnections] = useState<VaultConnection[]>([]);
  const [previewResult, setPreviewResult] = useState<string>("");
  const [executeResult, setExecuteResult] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      setError("");

      try {
        const [permissionResponse, connectionResponse] = await Promise.all([
          orchestratorClient.getMePermissions(),
          orchestratorClient.getMeConnections(),
        ]);

        if (!active) {
          return;
        }

        setDecisions(permissionResponse.decisions);
        setConnections(connectionResponse.connections);
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

  async function handlePreview() {
    setPreviewResult("");
    setExecuteResult("");
    setError("");

    try {
      const result = await orchestratorClient.previewAgentAction({
        action: "valuation.reconcile",
        connectionId: selectedConnectionId,
        payload: {
          listingId: "listing_demo_001",
        },
      });

      setPreviewResult(result.summary);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to preview agent action.",
      );
    }
  }

  async function handleExecute() {
    setPreviewResult("");
    setExecuteResult("");
    setError("");

    try {
      const result = await orchestratorClient.executeAgentAction({
        action: "valuation.reconcile",
        connectionId: selectedConnectionId,
        payload: {
          listingId: "listing_demo_001",
        },
      });

      setExecuteResult(`${result.status}: ${result.reasons.join(" ")}`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to execute agent action.",
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
          {previewResult ? <p className="feedback">{previewResult}</p> : null}
          {executeResult ? <p className="feedback">{executeResult}</p> : null}
        </Panel>
      </section>
    </main>
  );
}
