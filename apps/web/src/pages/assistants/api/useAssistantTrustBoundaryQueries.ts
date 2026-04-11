import { useQuery } from "@tanstack/react-query";
import type { AssistantTrustBoundarySummary } from "../types";

// TODO(sdk-consolidation): Replace with gateway-facing assistant boundary view types when available.
const MOCK_ASSISTANT_BOUNDARIES: Record<string, AssistantTrustBoundarySummary> =
  {
    asst_01H1: {
      assistantId: "asst_01H1",
      organization: {
        id: "org_003_qk",
        name: "QuantKnot AI",
        route: "/organizations/$organizationId",
        meta: "Finance application boundary",
      },
      reachableResources: [
        {
          id: "res_222_pg",
          name: "Payment_Gateway_v3",
          route: "/resources/$resourceId",
          meta: "Critical API",
        },
      ],
      delegatedAccounts: [
        {
          id: "conn_2111b_st",
          provider: "Stripe",
          accountName: "stripe-us-main",
          connectionState: "NEEDS_ATTENTION",
        },
      ],
      delegations: [
        {
          id: "dlg_alpha_fin",
          name: "Finance Stripe read delegation",
          route: "/delegations/$delegationId",
          meta: "Active",
        },
      ],
      governingPolicies: [
        {
          id: "pol_333_fr",
          name: "Financial-Reporting-RO",
          route: "/policies/$policyId",
          meta: "Production warning",
        },
      ],
      auditSignals: [
        {
          id: "evt_9F8e7D6c5b",
          label: "Denied write attempt on resource boundary",
          severity: "warning",
          route: "/audit",
        },
      ],
      securitySignals: [
        {
          id: "risk_1",
          label: "Connected account key rotation overdue",
          severity: "high",
          route: "/security",
        },
      ],
    },
    asst_01H2: {
      assistantId: "asst_01H2",
      organization: {
        id: "org_001_nc",
        name: "NeuroCore Systems",
        route: "/organizations/$organizationId",
        meta: "Engineering delivery boundary",
      },
      reachableResources: [
        {
          id: "res_111_rdmp",
          name: "FY24_Internal_Roadmap.pdf",
          route: "/resources/$resourceId",
          meta: "Normal document",
        },
      ],
      delegatedAccounts: [
        {
          id: "conn_1092a_gh",
          provider: "GitHub",
          accountName: "actbound-engineering-org",
          connectionState: "HEALTHY",
        },
      ],
      delegations: [
        {
          id: "dlg_cicd_bot",
          name: "CI/CD repository automation delegation",
          route: "/delegations/$delegationId",
          meta: "Pending",
        },
      ],
      governingPolicies: [
        {
          id: "pol_111_ca",
          name: "Cloud-Admin-Global-Override",
          route: "/policies/$policyId",
          meta: "Break-glass review required",
        },
      ],
      auditSignals: [
        {
          id: "evt_5X4y3Z2w1V",
          label: "Delegation grant recorded with elevated privilege warning",
          severity: "warning",
          route: "/audit",
        },
      ],
      securitySignals: [],
    },
    asst_01H3: {
      assistantId: "asst_01H3",
      organization: {
        id: "org_002_va",
        name: "Vanguard Aero",
        route: "/organizations/$organizationId",
        meta: "Aerospace security review boundary",
      },
      reachableResources: [
        {
          id: "res_333_ec",
          name: "Edge_Compute_Node_04",
          route: "/resources/$resourceId",
          meta: "High sensitivity infrastructure",
        },
      ],
      delegatedAccounts: [
        {
          id: "conn_aws_sec",
          provider: "AWS",
          accountName: "aws-security-audit-role",
          connectionState: "DISCONNECTED",
        },
      ],
      delegations: [
        {
          id: "dlg_sec_guard",
          name: "AWS security audit role delegation",
          route: "/delegations/$delegationId",
          meta: "Revoked",
        },
      ],
      governingPolicies: [
        {
          id: "pol_111_ca",
          name: "Cloud-Admin-Global-Override",
          route: "/policies/$policyId",
          meta: "Break-glass review required",
        },
      ],
      auditSignals: [
        {
          id: "evt_9F8e7D6c5b",
          label: "Denied resource access remains visible in audit",
          severity: "warning",
          route: "/audit",
        },
      ],
      securitySignals: [
        {
          id: "risk_2",
          label: "Out-of-scope bucket access attempt",
          severity: "warning",
          route: "/security",
        },
      ],
    },
    asst_01H4: {
      assistantId: "asst_01H4",
      organization: {
        id: "org_001_nc",
        name: "NeuroCore Systems",
        route: "/organizations/$organizationId",
        meta: "Experience research boundary",
      },
      reachableResources: [],
      delegatedAccounts: [
        {
          id: "conn_3992c_sl",
          provider: "Slack",
          accountName: "ActBound HQ",
          connectionState: "HEALTHY",
        },
      ],
      delegations: [],
      governingPolicies: [],
      auditSignals: [],
      securitySignals: [],
    },
  };

export const useAssistantTrustBoundarySummary = (assistantId: string) => {
  return useQuery<AssistantTrustBoundarySummary | null>({
    queryKey: ["assistants", "trust-boundary", assistantId],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 450));
      return MOCK_ASSISTANT_BOUNDARIES[assistantId] ?? null;
    },
    enabled: !!assistantId,
    staleTime: 1000 * 60 * 5,
  });
};
