import { useQuery } from "@tanstack/react-query";
import { Policy, SimulationTrace } from "../types";

const MOCK_POLICIES: Policy[] = [
  {
    id: "pol_111_ca",
    name: "Cloud-Admin-Global-Override",
    description:
      "Bypasses standard RBAC constraints for break-glass scenarios.",
    env: "production",
    scope: "tenant",
    author: "Sarah Chen",
    status: "active",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "pol_222_dl",
    name: "Data-Lake-Regional-Access",
    description: "Enforces EU residency bounds for central-1 infrastructure.",
    env: "staging",
    scope: "eu-central-1",
    author: "Marc Aurel",
    status: "draft",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "pol_333_fr",
    name: "Financial-Reporting-RO",
    description:
      "Governs read/write access to sensitive financial records for regional audits.",
    env: "production",
    scope: "finance-app",
    author: "Sarah Chen",
    status: "warning",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: "pol_444_ls",
    name: "Legacy-Storage-Vault",
    description: "Outdated cold storage access path definition.",
    env: "deprecated",
    scope: "global",
    author: "System Auto",
    status: "archived",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
];

const MOCK_TRACE: SimulationTrace = {
  id: "trace_001_auth",
  policyId: "pol_333_fr",
  context: {
    sourceIp: "10.0.4.122 (Internal VPN)",
    shiftStatus: "Within Working Hours (EDT)",
  },
  decision: "ALLOWED",
  steps: [
    {
      id: "step_1",
      name: "Global Deny-List Exclusion",
      detail:
        "System checked if user_001 is currently flagged in any active security incidents or global lockout lists.",
      outcome: "success",
    },
    {
      id: "step_2",
      name: "RBAC Entitlement Match",
      detail:
        "Role Finance Auditor includes ledger.read scope as a base entitlement.",
      outcome: "success",
    },
    {
      id: "step_3",
      name: "Time Window Check",
      detail: "14:22 falls within permitted [09:00 - 17:00] range.",
      outcome: "info",
    },
  ],
};

export const usePoliciesList = () => {
  return useQuery({
    queryKey: ["policies", "list"],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      return MOCK_POLICIES;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const usePolicyDetail = (id: string) => {
  return useQuery({
    queryKey: ["policies", "detail", id],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const pol = MOCK_POLICIES.find((o) => o.id === id);
      if (!pol) throw new Error("Policy not found");
      return pol;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
};

export const usePolicySimulationTrace = (policyId: string) => {
  return useQuery({
    queryKey: ["policies", "trace", policyId],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      // Just return mock trace assuming it ties to the request config
      return MOCK_TRACE;
    },
    enabled: !!policyId,
    staleTime: 1000 * 60 * 5,
  });
};
