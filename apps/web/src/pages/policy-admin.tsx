/**
 * Policy Engine Admin Page
 *
 * CRUD for ABAC policies + inline policy testing via the evaluation endpoint.
 * All data from backend — no policy logic in React.
 */

import { useEffect, useRef, useState } from "react";
import type { AbacPolicy, DecisionTraceResult } from "@actbound/sdk";
import { OrchestratorApiClient } from "@actbound/sdk";
import { StatusPill } from "@actbound/ui";
import { useConfig } from "../providers/config";

type ViewMode = "list" | "create" | "edit" | "test";

const EMPTY_POLICY: Omit<AbacPolicy, "id"> = {
  name: "",
  description: "",
  active: true,
  target: {},
  conditions: [],
  effect: "deny",
  priority: 50,
};

export function PolicyAdminPage() {
  const config = useConfig();
  const [policies, setPolicies] = useState<AbacPolicy[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [editingPolicy, setEditingPolicy] = useState<AbacPolicy | null>(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [testResult, setTestResult] = useState<DecisionTraceResult | null>(
    null,
  );
  const didLoad = useRef(false);
  const clientRef = useRef(
    new OrchestratorApiClient(config.orchestratorApiUrl),
  );
  const client = clientRef.current;

  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;
    void loadPolicies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadPolicies() {
    setIsLoading(true);
    try {
      const result = await client.listAbacPolicies();
      setPolicies(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load policies");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreate(policy: Omit<AbacPolicy, "id">) {
    setFeedback("");
    try {
      await client.createAbacPolicy(policy as Record<string, unknown>);
      setFeedback(`Policy "${policy.name}" created`);
      setViewMode("list");
      await loadPolicies();
    } catch (e) {
      setFeedback(`Error: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  async function handleUpdate(
    id: string,
    updates: Partial<Omit<AbacPolicy, "id">>,
  ) {
    setFeedback("");
    try {
      await client.updateAbacPolicy(id, updates as Record<string, unknown>);
      setFeedback("Policy updated");
      setViewMode("list");
      setEditingPolicy(null);
      await loadPolicies();
    } catch (e) {
      setFeedback(`Error: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete policy "${name}"?`)) return;
    setFeedback("");
    try {
      await client.deleteAbacPolicy(id);
      setFeedback(`Policy "${name}" deleted`);
      await loadPolicies();
    } catch (e) {
      setFeedback(`Error: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  async function handleToggle(policy: AbacPolicy) {
    try {
      await client.updateAbacPolicy(policy.id, {
        active: !policy.active,
      } as Record<string, unknown>);
      setFeedback(
        `${policy.name} ${policy.active ? "deactivated" : "activated"}`,
      );
      await loadPolicies();
    } catch (e) {
      setFeedback(`Error: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  async function handleTest(body: Record<string, unknown>) {
    setTestResult(null);
    try {
      const result = await client.evaluateAuthorization(body);
      setTestResult(result);
    } catch (e) {
      setFeedback(`Test error: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  if (isLoading) return <p className="dash-loading">Loading policies...</p>;
  if (error) return <p className="dash-error">{error}</p>;

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.25rem",
        }}
      >
        <div>
          <h2 style={{ fontSize: "1.5rem", margin: 0 }}>Policy Engine</h2>
          <span className="dash-panel__subtitle">
            Manage ABAC policies that influence authorization decisions.
          </span>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {viewMode !== "list" && (
            <button
              onClick={() => {
                setViewMode("list");
                setEditingPolicy(null);
                setTestResult(null);
              }}
              style={{
                background: "var(--card)",
                color: "var(--accent)",
                border: "1px solid var(--border)",
              }}
            >
              ← Back to List
            </button>
          )}
          {viewMode === "list" && (
            <>
              <button
                onClick={() => setViewMode("test")}
                style={{
                  background: "var(--card)",
                  color: "var(--accent)",
                  border: "1px solid var(--border)",
                }}
              >
                Test Policy
              </button>
              <button onClick={() => setViewMode("create")}>
                + Create Policy
              </button>
            </>
          )}
        </div>
      </div>

      {feedback && (
        <p
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            background: feedback.startsWith("Error") ? "#fde8e4" : "#d6f5df",
            marginBottom: "1rem",
            color: feedback.startsWith("Error") ? "#912e1f" : "var(--success)",
          }}
        >
          {feedback}
        </p>
      )}

      {viewMode === "list" && (
        <PolicyList
          policies={policies}
          onEdit={(p) => {
            setEditingPolicy(p);
            setViewMode("edit");
          }}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
      )}

      {viewMode === "create" && (
        <PolicyForm
          initial={EMPTY_POLICY}
          onSubmit={handleCreate}
          submitLabel="Create Policy"
        />
      )}

      {viewMode === "edit" && editingPolicy && (
        <PolicyForm
          initial={editingPolicy}
          onSubmit={(updates) => handleUpdate(editingPolicy.id, updates)}
          submitLabel="Save Changes"
        />
      )}

      {viewMode === "test" && (
        <PolicyTestPanel onTest={handleTest} result={testResult} />
      )}
    </>
  );
}

// ── Policy List ───────────────────────────────────────────

function PolicyList({
  policies,
  onEdit,
  onToggle,
  onDelete,
}: {
  policies: AbacPolicy[];
  onEdit: (p: AbacPolicy) => void;
  onToggle: (p: AbacPolicy) => void;
  onDelete: (id: string, name: string) => void;
}) {
  if (policies.length === 0) {
    return (
      <div className="dash-panel">
        <p className="empty-state">
          No policies defined yet. Create one to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="policy-list">
      {policies.map((policy) => (
        <div key={policy.id} className="policy-card">
          <div className="policy-card__header">
            <div>
              <strong className="policy-card__name">{policy.name}</strong>
              <p className="policy-card__desc">{policy.description}</p>
            </div>
            <div className="policy-card__badges">
              <StatusPill tone={policy.active ? "success" : "neutral"}>
                {policy.active ? "Active" : "Inactive"}
              </StatusPill>
              <StatusPill
                tone={
                  policy.effect === "deny"
                    ? "warning"
                    : policy.effect === "require_mfa"
                      ? "neutral"
                      : "success"
                }
              >
                {policy.effect === "require_mfa"
                  ? "Require MFA"
                  : policy.effect}
              </StatusPill>
            </div>
          </div>

          <div className="policy-card__meta">
            <div>
              <span className="policy-card__label">Priority</span>
              <span>{policy.priority}</span>
            </div>
            <div>
              <span className="policy-card__label">Target</span>
              <span>
                {[
                  policy.target.subjectType,
                  policy.target.resourceType,
                  policy.target.action,
                ]
                  .filter(Boolean)
                  .join(" · ") || "All requests"}
              </span>
            </div>
            <div>
              <span className="policy-card__label">Conditions</span>
              <span>{policy.conditions.length} rule(s)</span>
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
                  <span className="rule-pill__value">
                    {JSON.stringify(c.value)}
                  </span>
                </span>
              ))}
              <span
                className={`rule-pill rule-pill--action ${policy.effect === "deny" ? "rule-pill--deny" : ""}`}
              >
                THEN {policy.effect.toUpperCase().replace("_", " ")}
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              marginTop: "0.75rem",
            }}
          >
            <button
              onClick={() => onEdit(policy)}
              style={{
                padding: "0.35rem 0.65rem",
                fontSize: "0.82rem",
                background: "var(--card)",
                color: "var(--accent)",
                border: "1px solid var(--border)",
              }}
            >
              Edit
            </button>
            <button
              onClick={() => onToggle(policy)}
              style={{
                padding: "0.35rem 0.65rem",
                fontSize: "0.82rem",
                background: "var(--card)",
                color: policy.active ? "var(--warning)" : "var(--success)",
                border: "1px solid var(--border)",
              }}
            >
              {policy.active ? "Disable" : "Enable"}
            </button>
            <button
              onClick={() => onDelete(policy.id, policy.name)}
              style={{
                padding: "0.35rem 0.65rem",
                fontSize: "0.82rem",
                background: "#fde8e4",
                color: "#912e1f",
                border: "1px solid #f5c6c0",
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Policy Form ───────────────────────────────────────────

function PolicyForm({
  initial,
  onSubmit,
  submitLabel,
}: {
  initial: Omit<AbacPolicy, "id"> | AbacPolicy;
  onSubmit: (policy: Omit<AbacPolicy, "id">) => void;
  submitLabel: string;
}) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [active, setActive] = useState(initial.active);
  const [effect, setEffect] = useState(initial.effect);
  const [priority, setPriority] = useState(initial.priority);
  const [targetSubjectType, setTargetSubjectType] = useState(
    initial.target.subjectType ?? "",
  );
  const [targetResourceType, setTargetResourceType] = useState(
    initial.target.resourceType ?? "",
  );
  const [targetAction, setTargetAction] = useState(initial.target.action ?? "");
  const [conditions, setConditions] = useState(
    initial.conditions.map((c) => ({
      ...c,
      value: JSON.stringify(c.value),
    })),
  );

  function addCondition() {
    setConditions([
      ...conditions,
      { field: "", operator: "eq" as const, value: "" },
    ]);
  }

  function removeCondition(index: number) {
    setConditions(conditions.filter((_, i) => i !== index));
  }

  function updateCondition(index: number, field: string, value: string) {
    const updated = [...conditions];
    updated[index] = { ...updated[index]!, [field]: value };
    setConditions(updated);
  }

  function handleSubmit() {
    const policy: Omit<AbacPolicy, "id"> = {
      name,
      description,
      active,
      effect,
      priority,
      target: {
        ...(targetSubjectType
          ? { subjectType: targetSubjectType as "user" | "assistant" }
          : {}),
        ...(targetResourceType ? { resourceType: targetResourceType } : {}),
        ...(targetAction ? { action: targetAction } : {}),
      },
      conditions: conditions.map((c) => ({
        field: c.field,
        operator: c.operator as AbacPolicy["conditions"][0]["operator"],
        value: parseConditionValue(c.value),
      })),
    };
    onSubmit(policy);
  }

  return (
    <div className="dash-panel">
      <div className="dash-panel__header">
        <h2>{submitLabel}</h2>
      </div>

      <div className="form-grid">
        <label className="form-field">
          <span className="form-field__label">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Policy name..."
          />
        </label>

        <label className="form-field">
          <span className="form-field__label">Description</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What this policy does..."
          />
        </label>

        <div style={{ display: "flex", gap: "1rem" }}>
          <label className="form-field" style={{ flex: 1 }}>
            <span className="form-field__label">Effect</span>
            <select
              value={effect}
              onChange={(e) =>
                setEffect(e.target.value as AbacPolicy["effect"])
              }
            >
              <option value="deny">Deny</option>
              <option value="require_mfa">Require MFA</option>
              <option value="allow">Allow</option>
            </select>
          </label>

          <label className="form-field" style={{ flex: 1 }}>
            <span className="form-field__label">Priority</span>
            <input
              type="number"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
            />
          </label>

          <label
            className="form-field"
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            <span className="form-field__label" style={{ margin: 0 }}>
              Active
            </span>
          </label>
        </div>

        <div
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: "1rem",
            marginTop: "0.5rem",
          }}
        >
          <span className="form-field__label">Target (optional)</span>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
            <select
              value={targetSubjectType}
              onChange={(e) => setTargetSubjectType(e.target.value)}
              style={{ flex: 1 }}
            >
              <option value="">Any subject</option>
              <option value="user">User</option>
              <option value="assistant">Assistant</option>
            </select>
            <input
              value={targetResourceType}
              onChange={(e) => setTargetResourceType(e.target.value)}
              placeholder="Resource type..."
              style={{ flex: 1 }}
            />
            <input
              value={targetAction}
              onChange={(e) => setTargetAction(e.target.value)}
              placeholder="Action..."
              style={{ flex: 1 }}
            />
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: "1rem",
            marginTop: "0.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span className="form-field__label">Conditions</span>
            <button
              onClick={addCondition}
              style={{
                padding: "0.3rem 0.6rem",
                fontSize: "0.8rem",
                background: "var(--card)",
                color: "var(--accent)",
                border: "1px solid var(--border)",
              }}
            >
              + Add Condition
            </button>
          </div>

          {conditions.length === 0 && (
            <p className="empty-state" style={{ marginTop: "0.5rem" }}>
              No conditions. Policy will match all targeted requests.
            </p>
          )}

          {conditions.map((c, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: "0.5rem",
                marginTop: "0.5rem",
                alignItems: "center",
              }}
            >
              <input
                value={c.field}
                onChange={(e) => updateCondition(i, "field", e.target.value)}
                placeholder="Field (e.g., metadata.ip)"
                style={{ flex: 2 }}
              />
              <select
                value={c.operator}
                onChange={(e) => updateCondition(i, "operator", e.target.value)}
                style={{ flex: 1 }}
              >
                <option value="eq">equals</option>
                <option value="neq">not equals</option>
                <option value="gt">greater than</option>
                <option value="lt">less than</option>
                <option value="in">in list</option>
                <option value="not_in">not in list</option>
              </select>
              <input
                value={c.value}
                onChange={(e) => updateCondition(i, "value", e.target.value)}
                placeholder='Value (e.g., true, 1000, ["a","b"])'
                style={{ flex: 2 }}
              />
              <button
                onClick={() => removeCondition(i)}
                style={{
                  padding: "0.3rem 0.5rem",
                  fontSize: "0.8rem",
                  background: "#fde8e4",
                  color: "#912e1f",
                  border: "1px solid #f5c6c0",
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button onClick={handleSubmit} style={{ marginTop: "1rem" }}>
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

// ── Policy Test Panel ─────────────────────────────────────

function PolicyTestPanel({
  onTest,
  result,
}: {
  onTest: (body: Record<string, unknown>) => void;
  result: DecisionTraceResult | null;
}) {
  const [subjectType, setSubjectType] = useState("user");
  const [subjectId, setSubjectId] = useState("alice");
  const [resourceType, setResourceType] = useState("resource");
  const [resourceId, setResourceId] = useState("proj-1");
  const [action, setAction] = useState("viewer");
  const [metadataJson, setMetadataJson] = useState(
    '{\n  "ip": "203.0.113.5",\n  "mfaVerified": false\n}',
  );

  function handleSubmit() {
    let metadata: Record<string, unknown> = {};
    try {
      metadata = JSON.parse(metadataJson);
    } catch {
      /* leave empty */
    }
    onTest({
      subjectType,
      subjectId,
      resourceType,
      resourceId,
      action,
      metadata,
    });
  }

  return (
    <div className="dash-grid">
      <div className="dash-panel dash-panel--wide">
        <div className="dash-panel__header">
          <h2>Test Authorization Decision</h2>
          <span className="dash-panel__subtitle">
            Evaluate a sample request against all active policies and OpenFGA.
          </span>
        </div>

        <div className="form-grid">
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <label className="form-field" style={{ flex: 1 }}>
              <span className="form-field__label">Subject Type</span>
              <select
                value={subjectType}
                onChange={(e) => setSubjectType(e.target.value)}
              >
                <option value="user">User</option>
                <option value="assistant">Assistant</option>
              </select>
            </label>
            <label className="form-field" style={{ flex: 1 }}>
              <span className="form-field__label">Subject ID</span>
              <input
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
              />
            </label>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <label className="form-field" style={{ flex: 1 }}>
              <span className="form-field__label">Resource Type</span>
              <input
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
              />
            </label>
            <label className="form-field" style={{ flex: 1 }}>
              <span className="form-field__label">Resource ID</span>
              <input
                value={resourceId}
                onChange={(e) => setResourceId(e.target.value)}
              />
            </label>
          </div>

          <label className="form-field">
            <span className="form-field__label">Action</span>
            <input value={action} onChange={(e) => setAction(e.target.value)} />
          </label>

          <label className="form-field">
            <span className="form-field__label">Metadata (JSON)</span>
            <textarea
              value={metadataJson}
              onChange={(e) => setMetadataJson(e.target.value)}
              rows={4}
              style={{ fontFamily: "monospace", fontSize: "0.85rem" }}
            />
          </label>

          <button onClick={handleSubmit}>Evaluate</button>
        </div>
      </div>

      {result && (
        <div className="dash-panel">
          <div className="dash-panel__header">
            <h2>Decision Result</h2>
          </div>

          <div
            style={{
              textAlign: "center",
              padding: "1rem 0",
              fontSize: "2rem",
              fontWeight: 800,
            }}
          >
            <StatusPill
              tone={
                result.finalDecision === "allow"
                  ? "success"
                  : result.finalDecision === "deny"
                    ? "warning"
                    : "neutral"
              }
            >
              {result.finalDecision.toUpperCase().replace("_", " ")}
            </StatusPill>
          </div>

          <div
            style={{
              fontSize: "0.82rem",
              color: "var(--muted)",
              marginBottom: "1rem",
            }}
          >
            Duration: {result.totalDurationMs}ms · Request:{" "}
            {result.requestId.slice(0, 8)}...
          </div>

          <div className="auth-feed">
            {result.steps.map((step, i) => (
              <div key={i} className="auth-feed__item">
                <div className="auth-feed__left">
                  <strong style={{ textTransform: "uppercase" }}>
                    {step.layer}
                  </strong>
                  <StatusPill
                    tone={
                      step.result === "allow"
                        ? "success"
                        : step.result === "deny"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {step.result}
                  </StatusPill>
                </div>
                <div className="auth-feed__detail">{step.reason}</div>
                <div className="auth-feed__time">{step.durationMs}ms</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────

function parseConditionValue(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}
