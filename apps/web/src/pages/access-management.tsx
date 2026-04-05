/**
 * Access Management Page
 *
 * Combines organization membership, resource access, and explainability.
 * All data comes from the backend — no policy logic in React.
 *
 * NAMING: "assistant" for AI actors, never "agent" in the business UI.
 */

import { useEffect, useRef, useState } from "react";
import type {
  AccessEntry,
  ExplainResult,
  ResourceAccessView,
} from "@actbound/sdk";
import { OrchestratorApiClient } from "@actbound/sdk";
import { StatusPill } from "@actbound/ui";
import { useConfig } from "../providers/config";

type SubView = "org" | "resource";

const DEMO_ORG = "acme";
const DEMO_RESOURCE = "project-alpha";

export function AccessManagementPage() {
  const config = useConfig();
  const [view, setView] = useState<SubView>("org");
  const [resourceAccess, setResourceAccess] =
    useState<ResourceAccessView | null>(null);
  const [explainResult, setExplainResult] = useState<ExplainResult | null>(
    null,
  );
  const [selectedEntity, setSelectedEntity] = useState<{
    type: string;
    id: string;
  } | null>(null);
  const [mutationFeedback, setMutationFeedback] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const didLoad = useRef(false);
  const clientRef = useRef(
    new OrchestratorApiClient(config.orchestratorApiUrl),
  );

  const client = clientRef.current;

  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    setIsLoading(true);
    setError("");
    try {
      const access = await client.getResourceAccess(DEMO_RESOURCE);
      setResourceAccess(access);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load access data");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGrantUser(userId: string, level: string) {
    setMutationFeedback("");
    try {
      await client.grantUserResourceAccess(DEMO_RESOURCE, userId, level);
      setMutationFeedback(`Granted ${level} to ${userId}`);
      await loadData();
    } catch (e) {
      setMutationFeedback(
        `Error: ${e instanceof Error ? e.message : "failed"}`,
      );
    }
  }

  async function handleGrantAssistant(assistantId: string, level: string) {
    setMutationFeedback("");
    try {
      await client.grantAssistantResourceAccess(
        DEMO_RESOURCE,
        assistantId,
        level,
      );
      setMutationFeedback(`Granted ${level} to assistant ${assistantId}`);
      await loadData();
    } catch (e) {
      setMutationFeedback(
        `Error: ${e instanceof Error ? e.message : "failed"}`,
      );
    }
  }

  async function handleGrantOrg(orgId: string, level: string) {
    setMutationFeedback("");
    try {
      await client.grantOrgResourceAccess(DEMO_RESOURCE, orgId, level);
      setMutationFeedback(`Granted ${level} to organization ${orgId}`);
      await loadData();
    } catch (e) {
      setMutationFeedback(
        `Error: ${e instanceof Error ? e.message : "failed"}`,
      );
    }
  }

  async function handleRevoke(entry: AccessEntry) {
    setMutationFeedback("");
    try {
      if (entry.subjectType === "user") {
        await client.revokeUserResourceAccess(DEMO_RESOURCE, entry.subjectId);
      } else if (entry.subjectType === "assistant") {
        await client.revokeAssistantResourceAccess(
          DEMO_RESOURCE,
          entry.subjectId,
        );
      } else {
        await client.revokeOrgResourceAccess(DEMO_RESOURCE, entry.subjectId);
      }
      setMutationFeedback(`Revoked access for ${entry.subjectId}`);
      await loadData();
    } catch (e) {
      setMutationFeedback(
        `Error: ${e instanceof Error ? e.message : "failed"}`,
      );
    }
  }

  async function handleExplain(entityType: string, entityId: string) {
    setSelectedEntity({ type: entityType, id: entityId });
    setExplainResult(null);
    try {
      const result = await client.explainAccess(
        DEMO_RESOURCE,
        entityType,
        entityId,
      );
      setExplainResult(result);
    } catch (e) {
      setExplainResult(null);
      setError(e instanceof Error ? e.message : "Explain failed");
    }
  }

  async function handleAddOrgMember(userId: string) {
    try {
      await client.addOrgMember(DEMO_ORG, userId);
      setMutationFeedback(`Added ${userId} to ${DEMO_ORG}`);
      await loadData();
    } catch (e) {
      setMutationFeedback(
        `Error: ${e instanceof Error ? e.message : "failed"}`,
      );
    }
  }

  async function handleAssignAssistant(assistantId: string) {
    try {
      await client.assignAssistantToOrg(assistantId, DEMO_ORG);
      setMutationFeedback(`Assigned assistant ${assistantId} to ${DEMO_ORG}`);
      await loadData();
    } catch (e) {
      setMutationFeedback(
        `Error: ${e instanceof Error ? e.message : "failed"}`,
      );
    }
  }

  if (isLoading) return <p className="dash-loading">Loading access data...</p>;
  if (error) return <p className="dash-error">{error}</p>;

  const allEntries = [
    ...(resourceAccess?.users ?? []),
    ...(resourceAccess?.assistants ?? []),
    ...(resourceAccess?.organizations ?? []),
  ];

  return (
    <>
      {/* Page Header */}
      <div className="dash-panel__header" style={{ marginBottom: "1.25rem" }}>
        <h2 style={{ fontSize: "1.5rem", margin: 0 }}>
          {view === "org"
            ? `Organization: ${DEMO_ORG}`
            : `Resource: ${DEMO_RESOURCE}`}
        </h2>
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
          <button
            className={`dash-nav-item ${view === "org" ? "dash-nav-item--active" : ""}`}
            style={{
              padding: "0.4rem 0.8rem",
              background: view === "org" ? "var(--accent)" : "var(--card)",
              color: view === "org" ? "#fff" : "var(--accent)",
              border: "1px solid var(--border)",
            }}
            onClick={() => setView("org")}
          >
            Organization
          </button>
          <button
            className={`dash-nav-item ${view === "resource" ? "dash-nav-item--active" : ""}`}
            style={{
              padding: "0.4rem 0.8rem",
              background: view === "resource" ? "var(--accent)" : "var(--card)",
              color: view === "resource" ? "#fff" : "var(--accent)",
              border: "1px solid var(--border)",
            }}
            onClick={() => setView("resource")}
          >
            Resource Access
          </button>
        </div>
      </div>

      {mutationFeedback && (
        <p
          className={
            mutationFeedback.startsWith("Error")
              ? "dash-error"
              : "mutation-feedback"
          }
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            background: mutationFeedback.startsWith("Error")
              ? "#fde8e4"
              : "#d6f5df",
            marginBottom: "1rem",
          }}
        >
          {mutationFeedback}
        </p>
      )}

      <div className="dash-grid">
        {/* ── Left Column ──────────────────────────────────── */}
        <div className="dash-panel dash-panel--wide">
          {view === "org" ? (
            <OrgMembershipView
              orgId={DEMO_ORG}
              onAddMember={handleAddOrgMember}
              onAssignAssistant={handleAssignAssistant}
            />
          ) : (
            <ResourceAccessTable
              entries={allEntries}
              onRevoke={handleRevoke}
              onExplain={handleExplain}
              onGrantUser={handleGrantUser}
              onGrantAssistant={handleGrantAssistant}
              onGrantOrg={handleGrantOrg}
            />
          )}
        </div>

        {/* ── Right Column (Explainability) ─────────────────── */}
        <div>
          <ExplainPanel
            selectedEntity={selectedEntity}
            explainResult={explainResult}
          />
          <AccessOverviewPanel access={resourceAccess} />
        </div>
      </div>
    </>
  );
}

// ── Organization Membership View ──────────────────────────

function OrgMembershipView({
  orgId,
  onAddMember,
  onAssignAssistant,
}: {
  orgId: string;
  onAddMember: (userId: string) => void;
  onAssignAssistant: (assistantId: string) => void;
}) {
  const [newUserId, setNewUserId] = useState("");
  const [newAssistantId, setNewAssistantId] = useState("");

  return (
    <>
      <div className="dash-panel__header">
        <h2>Organization Members</h2>
        <span className="dash-panel__subtitle">
          Manage individuals and their administrative privileges within {orgId}.
        </span>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input
          placeholder="User ID to add..."
          value={newUserId}
          onChange={(e) => setNewUserId(e.target.value)}
          className="login-field__input"
          style={{
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "0.5rem 0.75rem",
            flex: 1,
          }}
        />
        <button
          onClick={() => {
            if (newUserId) {
              onAddMember(newUserId);
              setNewUserId("");
            }
          }}
          style={{ whiteSpace: "nowrap" }}
        >
          + Add Member
        </button>
      </div>

      <div
        style={{
          borderTop: "1px solid var(--border)",
          paddingTop: "1rem",
          marginTop: "1rem",
        }}
      >
        <h3 style={{ margin: "0 0 0.75rem" }}>AI Assistants</h3>
        <span className="dash-panel__subtitle">
          Autonomous entities authorized to act on behalf of the organization.
        </span>
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            marginTop: "0.75rem",
          }}
        >
          <input
            placeholder="Assistant ID..."
            value={newAssistantId}
            onChange={(e) => setNewAssistantId(e.target.value)}
            className="login-field__input"
            style={{
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "0.5rem 0.75rem",
              flex: 1,
            }}
          />
          <button
            onClick={() => {
              if (newAssistantId) {
                onAssignAssistant(newAssistantId);
                setNewAssistantId("");
              }
            }}
            style={{ whiteSpace: "nowrap" }}
          >
            + Assign Assistant
          </button>
        </div>
      </div>
    </>
  );
}

// ── Resource Access Table ─────────────────────────────────

function ResourceAccessTable({
  entries,
  onRevoke,
  onExplain,
  onGrantUser,
  onGrantAssistant,
  onGrantOrg,
}: {
  entries: AccessEntry[];
  onRevoke: (entry: AccessEntry) => void;
  onExplain: (entityType: string, entityId: string) => void;
  onGrantUser: (userId: string, level: string) => void;
  onGrantAssistant: (assistantId: string, level: string) => void;
  onGrantOrg: (orgId: string, level: string) => void;
}) {
  const [grantType, setGrantType] = useState<"user" | "assistant" | "org">(
    "user",
  );
  const [grantId, setGrantId] = useState("");
  const [grantLevel, setGrantLevel] = useState("viewer");

  function handleGrant() {
    if (!grantId) return;
    if (grantType === "user") onGrantUser(grantId, grantLevel);
    else if (grantType === "assistant") onGrantAssistant(grantId, grantLevel);
    else onGrantOrg(grantId, grantLevel);
    setGrantId("");
  }

  return (
    <>
      <div className="dash-panel__header">
        <h2>Access Overview</h2>
        <span className="dash-panel__subtitle">
          Combined view of all entities with permissions to this resource.
        </span>
      </div>

      {/* Grant form */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1.25rem",
          flexWrap: "wrap",
        }}
      >
        <select
          value={grantType}
          onChange={(e) =>
            setGrantType(e.target.value as "user" | "assistant" | "org")
          }
          style={{
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "0.5rem",
            background: "var(--card)",
          }}
        >
          <option value="user">User</option>
          <option value="assistant">Assistant</option>
          <option value="org">Organization</option>
        </select>
        <input
          placeholder="Entity ID..."
          value={grantId}
          onChange={(e) => setGrantId(e.target.value)}
          className="login-field__input"
          style={{
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "0.5rem 0.75rem",
            flex: 1,
          }}
        />
        <select
          value={grantLevel}
          onChange={(e) => setGrantLevel(e.target.value)}
          style={{
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "0.5rem",
            background: "var(--card)",
          }}
        >
          <option value="viewer">Viewer</option>
          <option value="editor">Editor</option>
          {grantType === "assistant" && (
            <option value="operator">Operator</option>
          )}
        </select>
        <button onClick={handleGrant}>Grant Access</button>
      </div>

      {/* Access table */}
      {entries.length === 0 ? (
        <p className="empty-state">
          No access grants yet. Use the form above to grant access.
        </p>
      ) : (
        <div className="access-table">
          <div className="access-table__header">
            <span>Entity</span>
            <span>Type</span>
            <span>Access Level</span>
            <span>Source</span>
            <span>Actions</span>
          </div>
          {entries.map((entry, i) => (
            <div
              key={`${entry.subjectType}-${entry.subjectId}-${i}`}
              className="access-table__row"
            >
              <span className="access-table__entity">{entry.subjectId}</span>
              <span>
                <StatusPill
                  tone={
                    entry.subjectType === "assistant" ? "neutral" : "success"
                  }
                >
                  {entry.subjectType === "assistant"
                    ? "Assistant"
                    : entry.subjectType === "organization"
                      ? "Organization"
                      : "User"}
                </StatusPill>
              </span>
              <span
                style={{
                  color:
                    entry.accessLevel === "editor" ||
                    entry.accessLevel === "operator"
                      ? "var(--accent)"
                      : "var(--muted)",
                  fontWeight: 600,
                }}
              >
                {entry.accessLevel}
              </span>
              <span>
                <StatusPill
                  tone={entry.source === "direct" ? "success" : "warning"}
                >
                  {entry.source === "direct" ? "Direct" : "Inherited"}
                </StatusPill>
              </span>
              <span style={{ display: "flex", gap: "0.4rem" }}>
                <button
                  onClick={() => onExplain(entry.subjectType, entry.subjectId)}
                  style={{
                    padding: "0.3rem 0.5rem",
                    fontSize: "0.78rem",
                    background: "var(--card)",
                    color: "var(--accent)",
                    border: "1px solid var(--border)",
                  }}
                >
                  Why?
                </button>
                {entry.source === "direct" && (
                  <button
                    onClick={() => onRevoke(entry)}
                    style={{
                      padding: "0.3rem 0.5rem",
                      fontSize: "0.78rem",
                      background: "#fde8e4",
                      color: "#912e1f",
                      border: "1px solid #f5c6c0",
                    }}
                  >
                    Revoke
                  </button>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── Explain Panel ─────────────────────────────────────────

function ExplainPanel({
  selectedEntity,
  explainResult,
}: {
  selectedEntity: { type: string; id: string } | null;
  explainResult: ExplainResult | null;
}) {
  if (!selectedEntity) {
    return (
      <div className="dash-panel" style={{ marginBottom: "1rem" }}>
        <div className="dash-panel__header">
          <h2>Relationship Insight</h2>
          <span className="dash-panel__subtitle">
            Select an entity and click "Why?" to see the access path.
          </span>
        </div>
      </div>
    );
  }

  if (!explainResult) {
    return (
      <div className="dash-panel" style={{ marginBottom: "1rem" }}>
        <div className="dash-panel__header">
          <h2>Loading explanation...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-panel" style={{ marginBottom: "1rem" }}>
      <div className="dash-panel__header">
        <h2>Why does {selectedEntity.id} have access?</h2>
        <span className="dash-panel__subtitle">
          Visualization of the permission inheritance path.
        </span>
      </div>

      {/* Vertical path visualization */}
      <div className="explain-path">
        {explainResult.path.map((step, i) => (
          <div key={i} className="explain-path__step">
            <div className="explain-path__icon">
              {step.icon === "identity"
                ? "👤"
                : step.icon === "membership"
                  ? "🏢"
                  : step.icon === "permission"
                    ? "🔐"
                    : step.icon === "policy"
                      ? "📋"
                      : "✅"}
            </div>
            <div>
              <div className="explain-path__title">{step.title}</div>
              <div className="explain-path__subtitle">{step.subtitle}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="policy-reason" style={{ marginTop: "1rem" }}>
        <div className="policy-reason__label">Summary</div>
        <div className="policy-reason__summary">{explainResult.summary}</div>
      </div>
    </div>
  );
}

// ── Access Overview Panel ─────────────────────────────────

function AccessOverviewPanel({
  access,
}: {
  access: ResourceAccessView | null;
}) {
  if (!access) return null;

  return (
    <div className="dash-panel">
      <div className="dash-panel__header">
        <h2>Access Overview</h2>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.9rem",
          }}
        >
          <span>👤 Total Users</span>
          <strong style={{ color: "var(--accent)" }}>
            {access.users.length}
          </strong>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.9rem",
          }}
        >
          <span>🤖 AI Assistants</span>
          <strong style={{ color: "var(--accent)" }}>
            {access.assistants.length}
          </strong>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.9rem",
          }}
        >
          <span>🏢 Organizations</span>
          <strong style={{ color: "var(--accent)" }}>
            {access.organizations.length}
          </strong>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.9rem",
          }}
        >
          <span>🔗 Inherited</span>
          <strong style={{ color: "var(--accent)" }}>
            {access.users.filter((u) => u.source === "inherited").length}
          </strong>
        </div>
      </div>
    </div>
  );
}
