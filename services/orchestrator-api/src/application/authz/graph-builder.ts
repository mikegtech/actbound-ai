/**
 * Access Graph Builder
 *
 * Converts a DecisionTrace into a structured graph + narrative path
 * for the "Why does this user have access?" UI.
 *
 * Deterministic output — same trace always produces the same graph.
 */

import type { DecisionTrace } from "./trace-types";
import type {
  AccessGraph,
  ExplainResult,
  GraphEdge,
  GraphNode,
  PathStep,
} from "./graph-types";

export function buildExplainResult(trace: DecisionTrace): ExplainResult {
  const graph = buildAccessGraph(trace);
  const path = buildPath(trace);
  const summary = buildSummary(trace);

  return {
    summary,
    graph,
    trace: {
      requestId: trace.requestId,
      action: trace.action,
      finalDecision: trace.finalDecision,
      steps: trace.steps.map((s) => ({
        layer: s.layer,
        result: s.result,
        reason: s.reason,
      })),
    },
    path,
  };
}

function buildAccessGraph(trace: DecisionTrace): AccessGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const seenNodes = new Set<string>();

  // Subject node
  const subjectId = `${trace.subject.type}:${trace.subject.id}`;
  addNode(nodes, seenNodes, {
    id: subjectId,
    type: trace.subject.type,
    label: trace.subject.id,
    meta: { principalType: trace.subject.type },
  });

  // Resource node
  const resourceId = `${trace.resource.type}:${trace.resource.id}`;
  addNode(nodes, seenNodes, {
    id: resourceId,
    type: "resource",
    label: trace.resource.id,
    meta: { resourceType: trace.resource.type },
  });

  // Parse OpenFGA steps for relationship information
  for (const step of trace.steps) {
    if (step.layer !== "openfga") continue;

    if (step.metadata?.inheritedVia) {
      // Inherited access: subject → org → resource
      const orgId = step.metadata.inheritedVia as string;
      const orgRelation = (step.metadata.userOrgRelation as string) ?? "member";
      const resourceRelation =
        (step.metadata.orgRelation as string) ?? "viewer";

      addNode(nodes, seenNodes, {
        id: orgId,
        type: "organization",
        label: orgId.replace("organization:", ""),
      });

      edges.push({
        from: subjectId,
        to: orgId,
        relation: orgRelation,
        primary: true,
      });

      edges.push({
        from: orgId,
        to: resourceId,
        relation: resourceRelation,
        primary: true,
      });
    } else if (step.metadata?.directCheck && step.result === "allow") {
      // Direct access: subject → resource
      edges.push({
        from: subjectId,
        to: resourceId,
        relation: trace.action,
        primary: true,
      });
    }
  }

  // Decision node
  const decisionId = "decision:result";
  addNode(nodes, seenNodes, {
    id: decisionId,
    type: "decision",
    label: trace.finalDecision === "allow" ? "Access Granted" : "Access Denied",
    meta: { decision: trace.finalDecision },
  });

  // Edge from resource to decision
  edges.push({
    from: resourceId,
    to: decisionId,
    relation: trace.finalDecision,
  });

  return { nodes, edges };
}

function buildPath(trace: DecisionTrace): PathStep[] {
  const steps: PathStep[] = [];

  // Identity step
  steps.push({
    icon: "identity",
    title: `${trace.subject.id}`,
    subtitle: trace.subject.type.toUpperCase(),
  });

  // Check for inherited access
  const inheritedStep = trace.steps.find(
    (s) => s.layer === "openfga" && s.metadata?.inheritedVia,
  );

  if (inheritedStep) {
    const orgId = (inheritedStep.metadata?.inheritedVia as string)?.replace(
      "organization:",
      "",
    );
    const orgRelation = inheritedStep.metadata?.userOrgRelation as string;

    steps.push({
      icon: "membership",
      title: `Member of ${orgId}`,
      subtitle: `${orgRelation?.toUpperCase() ?? "MEMBERSHIP"}`,
    });

    steps.push({
      icon: "permission",
      title: `Org has ${inheritedStep.metadata?.orgRelation} Access`,
      subtitle: "INHERITED PERMISSION",
    });
  } else {
    // Direct access
    const directStep = trace.steps.find(
      (s) =>
        s.layer === "openfga" &&
        s.result === "allow" &&
        s.metadata?.directCheck,
    );

    if (directStep) {
      steps.push({
        icon: "permission",
        title: `Direct ${trace.action} Access`,
        subtitle: "DIRECT PERMISSION",
      });
    }
  }

  // ABAC policy step (if triggered)
  const abacStep = trace.steps.find(
    (s) => s.layer === "abac" && s.result !== "skip",
  );
  if (abacStep) {
    steps.push({
      icon: "policy",
      title: abacStep.metadata?.policyName
        ? `Policy: ${abacStep.metadata.policyName}`
        : "Policy Evaluated",
      subtitle: abacStep.result.toUpperCase(),
    });
  }

  // Result step
  steps.push({
    icon: "result",
    title:
      trace.finalDecision === "allow"
        ? "Access Granted"
        : trace.finalDecision === "require_mfa"
          ? "MFA Required"
          : "Access Denied",
    subtitle: "RESULT",
  });

  return steps;
}

function buildSummary(trace: DecisionTrace): string {
  if (trace.finalDecision === "deny") {
    const denyStep = trace.steps.find((s) => s.result === "deny");
    return (
      denyStep?.reason ??
      `${trace.subject.id} does not have ${trace.action} access`
    );
  }

  if (trace.finalDecision === "require_mfa") {
    const mfaStep = trace.steps.find((s) => s.result === "require_mfa");
    return (
      mfaStep?.reason ?? "MFA verification required before access is granted"
    );
  }

  const inheritedStep = trace.steps.find((s) => s.metadata?.inheritedVia);

  if (inheritedStep) {
    const orgId = (inheritedStep.metadata?.inheritedVia as string)?.replace(
      "organization:",
      "",
    );
    return `Inherited from Organization Root Policy: ${trace.subject.id} is a member of ${orgId}, which grants ${trace.action} access.`;
  }

  return `${trace.subject.id} has direct ${trace.action} access to ${trace.resource.id}`;
}

function addNode(nodes: GraphNode[], seen: Set<string>, node: GraphNode): void {
  if (seen.has(node.id)) return;
  seen.add(node.id);
  nodes.push(node);
}
