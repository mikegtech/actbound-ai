import { useQuery } from "@tanstack/react-query";
import type {
  SecurityPosture,
  RiskIndicator,
  DeniedPolicySnapshot,
  SecurityControlItem,
} from "../types";

// Mock delays
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useSecurityPosture() {
  return useQuery({
    queryKey: ["security", "posture"],
    queryFn: async (): Promise<SecurityPosture> => {
      await delay(600);
      return {
        overallState: "warning",
        deniedOperationsLast24h: 14,
        activeHighSensitivityGrants: 3,
        lastSecurityEventTimestamp: Date.now() - 1000 * 60 * 45, // 45 mins ago
      };
    },
  });
}

export function useRiskIndicators() {
  return useQuery({
    queryKey: ["security", "risks"],
    queryFn: async (): Promise<RiskIndicator[]> => {
      await delay(800);
      return [
        {
          id: "risk_1",
          sourceType: "connected_account",
          sourceId: "conn_2111b_st",
          sourceName: "Stripe production connected account",
          relatedAssistantId: "asst_01H1",
          relatedDelegationId: "dlg_alpha_fin",
          relatedPolicyId: "pol_333_fr",
          relatedResourceId: "res_222_pg",
          relatedOrganizationId: "org_003_qk",
          auditEventId: "evt_9F8e7D6c5b",
          severity: "high",
          description: "Key rotation overdue by 14 days.",
          detectedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
        },
        {
          id: "risk_2",
          sourceType: "delegation",
          sourceId: "dlg_sec_guard",
          sourceName: "AWS security audit role delegation",
          relatedAssistantId: "asst_01H3",
          relatedDelegationId: "dlg_sec_guard",
          relatedPolicyId: "pol_111_ca",
          relatedResourceId: "res_333_ec",
          relatedOrganizationId: "org_002_va",
          auditEventId: "evt_9F8e7D6c5b",
          severity: "medium",
          description:
            "Attempted to access out-of-scope bucket s3://archive-logs.",
          detectedAt: Date.now() - 1000 * 60 * 60 * 5,
        },
      ];
    },
  });
}

export function useDeniedPolicySnapshots() {
  return useQuery({
    queryKey: ["security", "denials"],
    queryFn: async (): Promise<DeniedPolicySnapshot[]> => {
      await delay(700);
      return [
        {
          id: "denial_1",
          policyId: "pol_111_ca",
          policyName: "Cloud-Admin-Global-Override",
          assistantId: "asst_01H3",
          assistantName: "Cyber-Guard Prime",
          resourceId: "res_333_ec",
          resourceName: "Edge_Compute_Node_04",
          resourceType: "infrastructure",
          organizationId: "org_002_va",
          delegationId: "dlg_sec_guard",
          auditEventId: "evt_9F8e7D6c5b",
          actionAttempted: "aws:iam_write",
          deniedAt: Date.now() - 1000 * 60 * 15,
        },
        {
          id: "denial_2",
          policyId: "pol_333_fr",
          policyName: "Financial-Reporting-RO",
          assistantId: "asst_01H1",
          assistantName: "Fin-Sentry Alpha",
          resourceId: "res_222_pg",
          resourceName: "Payment_Gateway_v3",
          resourceType: "api",
          organizationId: "org_003_qk",
          delegationId: "dlg_alpha_fin",
          auditEventId: "evt_9F8e7D6c5b",
          actionAttempted: "stripe:Refund",
          deniedAt: Date.now() - 1000 * 60 * 60 * 12,
        },
      ];
    },
  });
}

export function useSecurityControls() {
  return useQuery({
    queryKey: ["security", "controls"],
    queryFn: async (): Promise<SecurityControlItem[]> => {
      await delay(550);
      return [
        {
          id: "ctrl_connected_account_rotation",
          title: "Connected Account Review",
          description:
            "Stripe production is marked needs-attention and is linked to Fin-Sentry Alpha through an active finance delegation.",
          severity: "high",
          sourceType: "connected_account",
          sourceId: "conn_2111b_st",
          sourceLabel: "stripe-us-main",
          relatedDelegationId: "dlg_alpha_fin",
          route: "/delegations/$delegationId",
          actionLabel: "Rotate Now",
          actionReason:
            "Key rotation is disabled until Connected Account mutation flows exist.",
        },
        {
          id: "ctrl_delegation_review",
          title: "Delegation Pending Attention",
          description:
            "The finance Stripe read delegation has a related security signal and should be reviewed before expanding scopes.",
          severity: "medium",
          sourceType: "delegation",
          sourceId: "dlg_alpha_fin",
          sourceLabel: "Finance Stripe read delegation",
          route: "/delegations/$delegationId",
          actionLabel: "Revoke Delegation",
          actionReason:
            "Delegation revocation is disabled until a safe mutation flow exists.",
        },
      ];
    },
  });
}
