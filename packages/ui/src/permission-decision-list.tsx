import type { PermissionDecisionRecord } from "@actbound/sdk";

import { StatusPill } from "./status-pill";

type PermissionDecisionListProps = {
  decisions: PermissionDecisionRecord[];
};

export function PermissionDecisionList({
  decisions,
}: PermissionDecisionListProps) {
  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      {decisions.map((decision) => (
        <article
          key={decision.permission}
          style={{
            borderRadius: "18px",
            border: "1px solid rgba(19, 48, 70, 0.1)",
            background: "#fffdf9",
            padding: "0.85rem 1rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "1rem",
              alignItems: "center",
              marginBottom: "0.5rem",
            }}
          >
            <strong style={{ color: "#10263b" }}>{decision.permission}</strong>
            <StatusPill tone={decision.allowed ? "success" : "warning"}>
              {decision.allowed ? "Allowed" : "Denied"}
            </StatusPill>
          </div>
          <p style={{ margin: 0, color: "#355067", fontSize: "0.95rem" }}>
            {decision.reasons.join(" ")}
          </p>
        </article>
      ))}
    </div>
  );
}
