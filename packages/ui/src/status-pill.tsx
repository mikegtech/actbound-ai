import type { CSSProperties, ReactNode } from "react";

type StatusPillProps = {
  tone: "success" | "warning" | "neutral";
  children: ReactNode;
};

const tones: Record<StatusPillProps["tone"], CSSProperties> = {
  success: {
    background: "#d6f5df",
    color: "#0c5a2f",
  },
  warning: {
    background: "#ffe7cf",
    color: "#7a4111",
  },
  neutral: {
    background: "#dde8f3",
    color: "#17344c",
  },
};

export function StatusPill({ tone, children }: StatusPillProps) {
  return (
    <span
      style={{
        ...tones[tone],
        borderRadius: "999px",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        fontSize: "0.8rem",
        fontWeight: 600,
        padding: "0.35rem 0.7rem",
      }}
    >
      {children}
    </span>
  );
}
