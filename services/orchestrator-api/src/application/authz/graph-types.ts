/**
 * Access Graph types for explainability UI.
 *
 * Powers the "Why does this user have access?" visualization.
 * Nodes are entities (user, assistant, organization, resource).
 * Edges are relationships between them.
 */

export interface GraphNode {
  id: string;
  type: "user" | "assistant" | "organization" | "resource" | "decision";
  label: string;
  /** Additional display metadata. */
  meta?: Record<string, string>;
}

export interface GraphEdge {
  from: string;
  to: string;
  relation: string;
  /** Whether this edge is the primary path or a secondary relationship. */
  primary?: boolean;
}

export interface AccessGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ExplainResult {
  /** One-line summary for UI display. */
  summary: string;
  /** Structured graph of the access path. */
  graph: AccessGraph;
  /** Full authorization trace. */
  trace: {
    requestId: string;
    action: string;
    finalDecision: string;
    steps: Array<{
      layer: string;
      result: string;
      reason: string;
    }>;
  };
  /** Narrative explanation steps (for the vertical flow UI). */
  path: PathStep[];
}

export interface PathStep {
  icon: "identity" | "membership" | "permission" | "result" | "policy";
  title: string;
  subtitle: string;
}
