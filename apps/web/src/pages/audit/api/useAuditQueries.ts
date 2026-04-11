import { useQuery } from "@tanstack/react-query";
import type { AuditEventDto } from "../types";

const MOCK_AUDIT_EVENTS: AuditEventDto[] = [
  {
    id: "evt_1a2B3c4D5e",
    eventType: "policy.evaluation",
    action: "query",
    occurredAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    actor: {
      sub: "usr_abc123",
      principalType: "user",
      displayName: "Alice Security",
    },
    assistantContext: {
      assistantId: "asst_01H1",
      displayName: "Fin-Sentry Alpha",
      delegatedBySub: "usr_jane",
    },
    resource: {
      type: "api",
      id: "res_222_pg",
      displayName: "Payment_Gateway_v3",
      routeType: "resource",
    },
    organizationId: "org_003_qk",
    linkedEntities: [
      {
        type: "assistant",
        id: "asst_01H1",
        label: "Fin-Sentry Alpha",
        context: "assistant evaluated",
      },
      {
        type: "policy",
        id: "pol_333_fr",
        label: "Financial-Reporting-RO",
        context: "policy evaluated",
      },
      {
        type: "organization",
        id: "org_003_qk",
        label: "QuantKnot AI",
        context: "owning organization",
      },
    ],
    decision: {
      signal: "allowed",
    },
    metadata: {
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 Node.js",
    },
  },
  {
    id: "evt_9F8e7D6c5b",
    eventType: "resource.access",
    action: "write",
    occurredAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    actor: {
      sub: "asst_01H3",
      principalType: "assistant",
      displayName: "Cyber-Guard Prime",
    },
    assistantContext: {
      assistantId: "asst_01H3",
      displayName: "Cyber-Guard Prime",
      delegatedBySub: "usr_admin",
    },
    resource: {
      type: "infrastructure",
      id: "res_333_ec",
      displayName: "Edge_Compute_Node_04",
      routeType: "resource",
    },
    organizationId: "org_002_va",
    linkedEntities: [
      {
        type: "assistant",
        id: "asst_01H3",
        label: "Cyber-Guard Prime",
        context: "assistant actor",
      },
      {
        type: "delegation",
        id: "dlg_sec_guard",
        label: "AWS security audit role delegation",
        context: "delegation boundary",
      },
      {
        type: "policy",
        id: "pol_111_ca",
        label: "Cloud-Admin-Global-Override",
        context: "governing policy",
      },
      {
        type: "security_signal",
        id: "risk_2",
        label: "Out-of-scope bucket access attempt",
        context: "security signal",
      },
    ],
    decision: {
      signal: "denied",
      reasons: [
        {
          code: "OUT_OF_SCOPE",
          message:
            "Agent attempted write operation outside of delegated domain.",
        },
      ],
    },
    metadata: {
      operationParams: { override: true },
      context: "background-job",
    },
  },
  {
    id: "evt_5X4y3Z2w1V",
    eventType: "delegation.grant",
    action: "create",
    occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    actor: {
      sub: "usr_xyz789",
      principalType: "user",
      displayName: "Bob Manager",
    },
    assistantContext: {
      assistantId: "asst_01H2",
      displayName: "Build-Bot 7",
      delegatedBySub: "usr_devops",
    },
    resource: {
      type: "delegation",
      id: "dlg_cicd_bot",
      displayName: "CI/CD repository automation delegation",
      routeType: "delegation",
    },
    organizationId: "org_001_nc",
    linkedEntities: [
      {
        type: "assistant",
        id: "asst_01H2",
        label: "Build-Bot 7",
        context: "assistant receiving delegation",
      },
      {
        type: "delegation",
        id: "dlg_cicd_bot",
        label: "CI/CD repository automation delegation",
        context: "created delegation",
      },
      {
        type: "policy",
        id: "pol_111_ca",
        label: "Cloud-Admin-Global-Override",
        context: "policy requiring review",
      },
      {
        type: "organization",
        id: "org_001_nc",
        label: "NeuroCore Systems",
        context: "owning organization",
      },
    ],
    decision: {
      signal: "warning",
      reasons: [
        {
          code: "ELEVATED_PRIVILEGE",
          message: "Delegation grants boundary exception.",
        },
      ],
    },
  },
  {
    id: "evt_0o9i8U7y6T",
    eventType: "system.login",
    action: "authenticate",
    occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    actor: {
      sub: "usr_abc123",
      principalType: "user",
      displayName: "Alice Security",
    },
    organizationId: "org_003_qk",
    linkedEntities: [
      {
        type: "organization",
        id: "org_003_qk",
        label: "QuantKnot AI",
        context: "active user context",
      },
    ],
    decision: {
      signal: "allowed",
    },
    metadata: {
      method: "auth0_sso",
      location: "US-West",
    },
  },
];

export const useAuditEvents = () => {
  return useQuery({
    queryKey: ["audit-events"],
    queryFn: async () => {
      // Simulate network latency
      await new Promise((resolve) => setTimeout(resolve, 600));
      return MOCK_AUDIT_EVENTS;
    },
  });
};
