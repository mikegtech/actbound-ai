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
          <p
            style={{
              margin: "0 0 0.5rem",
              color: "#5f7485",
              fontSize: "0.82rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {decision.resource} / {decision.action}
          </p>
          <ul
            style={{
              display: "grid",
              gap: "0.45rem",
              margin: 0,
              paddingLeft: "1rem",
              color: "#355067",
              fontSize: "0.95rem",
            }}
          >
            {decision.reasons.map((reason) => (
              <li key={`${decision.permission}-${reason.code}`}>
                <code
                  style={{
                    background: "#f4eee4",
                    borderRadius: "8px",
                    color: "#7a4111",
                    fontSize: "0.78rem",
                    marginRight: "0.45rem",
                    padding: "0.12rem 0.4rem",
                  }}
                >
                  {reason.code}
                </code>
                {reason.message}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
