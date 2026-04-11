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
    conditions: [
      { field: "subject.role", operator: "in", value: ["incident_commander"] },
      { field: "request.reason", operator: "eq", value: "break_glass" },
    ],
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
    conditions: [
      { field: "resource.region", operator: "eq", value: "eu-central-1" },
    ],
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
    conditions: [
      { field: "subject.role", operator: "in", value: ["finance_auditor"] },
      { field: "resource.department", operator: "eq", value: "finance" },
      { field: "request.action", operator: "eq", value: "ledger.read" },
    ],
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
    conditions: [],
  },
];

const MOCK_TRACES: Record<string, SimulationTrace> = {
  pol_111_ca: {
    id: "trace_pol_111_ca",
    policyId: "pol_111_ca",
    context: {
      sourceIp: "10.12.4.18 (Corporate VPN)",
      shiftStatus: "Incident window approved",
    },
    decision: "REQUIRES_REVIEW",
    steps: [
      {
        id: "step_1",
        name: "Break-Glass Reason Check",
        detail:
          "The request supplied a break-glass reason, but emergency justification still requires manual reviewer confirmation.",
        outcome: "info",
      },
      {
        id: "step_2",
        name: "Incident Role Match",
        detail:
          "The actor is mapped to an incident commander role for this tenant boundary.",
        outcome: "success",
      },
      {
        id: "step_3",
        name: "Reviewer Gate",
        detail:
          "Privileged override remains blocked until an authorized reviewer approves the request.",
        outcome: "failure",
      },
    ],
  },
  pol_333_fr: {
    id: "trace_pol_333_fr",
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
          "System checked whether the actor is flagged in active security incident or lockout lists.",
        outcome: "success",
      },
      {
        id: "step_2",
        name: "Finance Department Match",
        detail:
          "The requested resource belongs to the finance department boundary required by this policy.",
        outcome: "success",
      },
      {
        id: "step_3",
        name: "Action Scope Check",
        detail: "ledger.read is covered by the policy action constraint.",
        outcome: "success",
      },
    ],
  },
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
  return useQuery<SimulationTrace | null>({
    queryKey: ["policies", "trace", policyId],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return MOCK_TRACES[policyId] ?? null;
    },
    enabled: !!policyId,
    staleTime: 1000 * 60 * 5,
  });
};
