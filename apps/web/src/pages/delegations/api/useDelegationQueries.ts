import { useQuery } from "@tanstack/react-query";
import type { ConnectedAccount, Delegation } from "../types";

// Hardcoded mock data to simulate realistic domain entities without connecting to an API cluster yet.

const mockConnectedAccounts: ConnectedAccount[] = [
  {
    id: "conn_1092a_gh",
    provider: "github",
    connectionState: "HEALTHY",
    accountName: "actbound-engineering-org",
    identityEmail: "github-bot@actbound.ai",
    assistantIds: ["AB-0442-E"],
    connectedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastSyncAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: "conn_2111b_st",
    provider: "stripe",
    connectionState: "NEEDS_ATTENTION",
    accountName: "stripe-us-main",
    identityEmail: "finance-admin@actbound.ai",
    assistantIds: ["AB-0912-F"],
    connectedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    lastSyncAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "conn_3992c_sl",
    provider: "slack",
    connectionState: "HEALTHY",
    accountName: "ActBound HQ",
    assistantIds: ["AB-0321-D"],
    connectedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    lastSyncAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: "conn_aws_sec",
    provider: "aws",
    connectionState: "DISCONNECTED",
    accountName: "aws-security-audit-role",
    assistantIds: ["AB-1100-S"],
    connectedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const mockDelegations: Delegation[] = [
  {
    id: "dlg_alpha_fin",
    grantor: {
      id: "usr_jane",
      name: "Jane Doe",
    },
    assistant: {
      id: "AB-0912-F",
      name: "Fin-Sentry Alpha",
    },
    organization: {
      id: "org_finance_us",
      name: "Finance US Region",
    },
    scopes: ["Stripe:Read:Charges", "Stripe:Read:Disputes"],
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString(),
    connectedAccountId: "conn_2111b_st",
  },
  {
    id: "dlg_cicd_bot",
    grantor: {
      id: "usr_devops",
      name: "DevOps System",
    },
    assistant: {
      id: "AB-0442-E",
      name: "Build-Bot 7",
    },
    organization: {
      id: "org_engineering",
      name: "Global Engineering",
    },
    scopes: ["GitHub:Repo:Read", "GitHub:Actions:Write"],
    status: "PENDING",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    connectedAccountId: "conn_1092a_gh",
  },
  {
    id: "dlg_sec_guard",
    grantor: {
      id: "usr_admin",
      name: "SuperAdmin",
    },
    assistant: {
      id: "AB-1100-S",
      name: "Cyber-Guard Prime",
    },
    organization: {
      id: "org_security",
      name: "Global Security",
    },
    scopes: ["AWS:IAM:Read", "AWS:CloudTrail:Read"],
    status: "REVOKED",
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    connectedAccountId: "conn_aws_sec",
  },
];

export const useDelegations = () => {
  return useQuery<Delegation[]>({
    queryKey: ["delegations"],
    queryFn: async () => {
      // simulate latency
      await new Promise((resolve) => setTimeout(resolve, 800));
      return mockDelegations;
    },
  });
};

export const useConnectedAccounts = () => {
  return useQuery<ConnectedAccount[]>({
    queryKey: ["connected-accounts"],
    queryFn: async () => {
      // simulate latency
      await new Promise((resolve) => setTimeout(resolve, 600));
      return mockConnectedAccounts;
    },
  });
};
