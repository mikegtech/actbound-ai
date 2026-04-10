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
    resource: {
      type: "repository",
      id: "repo_987",
      displayName: "actbound-core",
    },
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
      sub: "ast_456xyz",
      principalType: "assistant",
      displayName: "CodeReview Agent",
    },
    assistantContext: {
      assistantId: "ast_456xyz",
      displayName: "CodeReview Agent",
      delegatedBySub: "usr_abc123",
    },
    resource: {
      type: "document",
      id: "doc_444",
      displayName: "Architecture_Plan.md",
    },
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
    resource: {
      type: "delegation",
      id: "del_111",
      displayName: "Temporary Review Auth",
    },
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
