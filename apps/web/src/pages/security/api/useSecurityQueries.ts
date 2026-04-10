import { useQuery } from "@tanstack/react-query";
import type {
  SecurityPosture,
  RiskIndicator,
  DeniedPolicySnapshot,
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
          sourceId: "conn_aws_prod",
          sourceName: "AWS Production Boundary",
          severity: "high",
          description: "Key rotation overdue by 14 days.",
          detectedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
        },
        {
          id: "risk_2",
          sourceType: "assistant",
          sourceId: "ast_data_puller",
          sourceName: "Nightly Sync Agent",
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
          policyId: "pol_prod_write",
          policyName: "Production Write Barrier",
          assistantName: "Nightly Sync Agent",
          resourceType: "EC2 Instance",
          actionAttempted: "ec2:RebootInstances",
          deniedAt: Date.now() - 1000 * 60 * 15,
        },
        {
          id: "denial_2",
          policyId: "pol_stripe_read",
          policyName: "Stripe Global Read",
          assistantName: "Customer Support Bot",
          resourceType: "Stripe Charge",
          actionAttempted: "stripe:Refund",
          deniedAt: Date.now() - 1000 * 60 * 60 * 12,
        },
      ];
    },
  });
}
