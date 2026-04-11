import { useQuery } from "@tanstack/react-query";
import type {
  ConnectedAccount,
  Delegation,
  DelegationPostureSummary,
} from "../types";

// Hardcoded mock data to simulate realistic domain entities without connecting to an API cluster yet.

export const mockConnectedAccounts: ConnectedAccount[] = [
  {
    id: "conn_1092a_gh",
    provider: "github",
    connectionState: "HEALTHY",
    accountName: "actbound-engineering-org",
    identityEmail: "github-bot@actbound.ai",
    assistantIds: ["asst_01H2"],
    connectedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastSyncAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: "conn_2111b_st",
    provider: "stripe",
    connectionState: "NEEDS_ATTENTION",
    accountName: "stripe-us-main",
    identityEmail: "finance-admin@actbound.ai",
    assistantIds: ["asst_01H1"],
    connectedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    lastSyncAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "conn_3992c_sl",
    provider: "slack",
    connectionState: "HEALTHY",
    accountName: "ActBound HQ",
    assistantIds: ["asst_01H4"],
    connectedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    lastSyncAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: "conn_aws_sec",
    provider: "aws",
    connectionState: "DISCONNECTED",
    accountName: "aws-security-audit-role",
    assistantIds: ["asst_01H3"],
    connectedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockDelegations: Delegation[] = [
  {
    id: "dlg_alpha_fin",
    grantor: {
      id: "usr_jane",
      name: "Jane Doe",
    },
    assistant: {
      id: "asst_01H1",
      internalCode: "AB-0912-F",
      name: "Fin-Sentry Alpha",
    },
    organization: {
      id: "org_003_qk",
      name: "QuantKnot AI",
    },
    scopes: ["Stripe:Read:Charges", "Stripe:Read:Disputes"],
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString(),
    connectedAccountId: "conn_2111b_st",
    resourceIds: ["res_222_pg"],
    policyIds: ["pol_333_fr"],
    auditEventIds: ["evt_9F8e7D6c5b"],
    securitySignalIds: ["risk_1"],
  },
  {
    id: "dlg_cicd_bot",
    grantor: {
      id: "usr_devops",
      name: "DevOps System",
    },
    assistant: {
      id: "asst_01H2",
      internalCode: "AB-0442-E",
      name: "Build-Bot 7",
    },
    organization: {
      id: "org_001_nc",
      name: "NeuroCore Systems",
    },
    scopes: ["GitHub:Repo:Read", "GitHub:Actions:Write"],
    status: "PENDING",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    connectedAccountId: "conn_1092a_gh",
    resourceIds: ["res_111_rdmp"],
    policyIds: ["pol_111_ca"],
    auditEventIds: ["evt_5X4y3Z2w1V"],
    securitySignalIds: [],
  },
  {
    id: "dlg_sec_guard",
    grantor: {
      id: "usr_admin",
      name: "SuperAdmin",
    },
    assistant: {
      id: "asst_01H3",
      internalCode: "AB-1100-S",
      name: "Cyber-Guard Prime",
    },
    organization: {
      id: "org_002_va",
      name: "Vanguard Aero",
    },
    scopes: ["AWS:IAM:Read", "AWS:CloudTrail:Read"],
    status: "REVOKED",
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    connectedAccountId: "conn_aws_sec",
    resourceIds: ["res_333_ec"],
    policyIds: ["pol_111_ca"],
    auditEventIds: ["evt_9F8e7D6c5b"],
    securitySignalIds: ["risk_2"],
  },
];

const getDelegationPostureSummary = (): DelegationPostureSummary => {
  const activeDelegations = mockDelegations.filter(
    (delegation) => delegation.status === "ACTIVE",
  ).length;
  const pendingDelegations = mockDelegations.filter(
    (delegation) => delegation.status === "PENDING",
  ).length;
  const revokedDelegations = mockDelegations.filter(
    (delegation) => delegation.status === "REVOKED",
  ).length;
  const healthyConnections = mockConnectedAccounts.filter(
    (account) => account.connectionState === "HEALTHY",
  ).length;

  return {
    totalDelegations: mockDelegations.length,
    activeDelegations,
    pendingDelegations,
    revokedDelegations,
    healthyConnections,
    attentionConnections: mockConnectedAccounts.length - healthyConnections,
  };
};

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

export const useDelegationDetail = (id: string) => {
  return useQuery<Delegation>({
    queryKey: ["delegations", "detail", id],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const delegation = mockDelegations.find((item) => item.id === id);
      if (!delegation) throw new Error("Delegation not found");
      return delegation;
    },
    enabled: !!id,
  });
};

export const useConnectedAccountDetail = (id?: string) => {
  return useQuery<ConnectedAccount | null>({
    queryKey: ["connected-accounts", "detail", id],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      if (!id) return null;
      return mockConnectedAccounts.find((account) => account.id === id) ?? null;
    },
    enabled: Boolean(id),
  });
};

export const useDelegationPostureSummary = () => {
  return useQuery<DelegationPostureSummary>({
    queryKey: ["delegations", "posture-summary"],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
      return getDelegationPostureSummary();
    },
  });
};
