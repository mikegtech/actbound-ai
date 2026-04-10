import { useQuery } from "@tanstack/react-query";
import type { DashboardData } from "../types";

const fetchDashboardData = async (): Promise<DashboardData> => {
  await new Promise((resolve) => setTimeout(resolve, 800));

  return {
    metrics: {
      activeAssistants: 12,
      protectedResources: 184,
      activeDelegations: 45,
      recentPolicyEvents: 3,
    },
    recentAuditEvents: [
      {
        id: "evt-1",
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        actor: "assistant:finops-guardian",
        action: "policy.evaluate",
        resource: "github/repo/main",
        severity: "info",
        description:
          "Approved a bounded read against github/repo/main under the finance-reporting policy set.",
      },
      {
        id: "evt-2",
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        actor: "user:ops-admin@actbound.dev",
        action: "delegation.assume",
        resource: "aws/role/deployer",
        severity: "info",
        description:
          "Assumed the AWS deployer delegation after issuer, organization, and policy checks passed.",
      },
      {
        id: "evt-3",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        actor: "system:policy-engine",
        action: "policy.violation",
        resource: "s3/bucket/prod-data",
        severity: "warning",
        description:
          "Denied a cross-org read attempt against prod-data because the requester was outside the approved delegation scope.",
      },
    ],
    policyPosture: {
      totalPolicies: 24,
      activePolicies: 22,
      violationsInLast24h: 3,
      overallStatus: "degraded",
    },
    connectedAccounts: [
      {
        id: "acc-1",
        provider: "AWS",
        accountName: "aws/prod-deployer",
        status: "active",
        lastSync: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      },
      {
        id: "acc-2",
        provider: "GitHub",
        accountName: "github/actbound-control-plane",
        status: "active",
        lastSync: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      },
      {
        id: "acc-3",
        provider: "Slack",
        accountName: "slack/security-bridge",
        status: "error",
        lastSync: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      },
    ],
  };
};

export const useDashboardData = () => {
  return useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: fetchDashboardData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
