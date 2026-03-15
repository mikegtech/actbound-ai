import type { CSSProperties, ReactNode } from "react";

type PanelProps = {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  footer?: ReactNode;
};

const panelStyle: CSSProperties = {
  borderRadius: "24px",
  border: "1px solid rgba(19, 48, 70, 0.12)",
  background: "rgba(255, 251, 244, 0.92)",
  boxShadow: "0 20px 60px rgba(19, 48, 70, 0.08)",
  padding: "1.25rem",
};

export function Panel({ title, eyebrow, children, footer }: PanelProps) {
  return (
    <section style={panelStyle}>
      {eyebrow ? (
        <p
          style={{
            margin: 0,
            color: "#8a5a2b",
            fontSize: "0.75rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        style={{
          margin: "0.35rem 0 1rem",
          fontSize: "1.15rem",
          color: "#10263b",
        }}
      >
        {title}
      </h2>
      <div>{children}</div>
      {footer ? <div style={{ marginTop: "1rem" }}>{footer}</div> : null}
    </section>
  );
}
