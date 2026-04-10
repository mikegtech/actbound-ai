import { useQuery } from "@tanstack/react-query";
import { Organization } from "../types";

const MOCK_ORGS: Organization[] = [
  {
    id: "org_001_nc",
    name: "NeuroCore Systems",
    internalCode: "NC-8829-X",
    healthScore: 98,
    assistantCount: 22,
    resourceCount: 412,
    status: "active",
    description:
      "Primary computational infrastructure maintaining cross-region automated load balancing.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString(),
  },
  {
    id: "org_002_va",
    name: "Vanguard Aero",
    internalCode: "VA-1102-L",
    healthScore: 44,
    assistantCount: 7,
    resourceCount: 88,
    status: "active",
    description: "Defense and aerospace contractor integrations node.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180).toISOString(),
  },
  {
    id: "org_003_qk",
    name: "QuantKnot AI",
    internalCode: "QK-5541-Q",
    healthScore: 100,
    assistantCount: 52,
    resourceCount: 1400,
    status: "active",
    description:
      "High-frequency algorithmic trading modeling and market ingestion layer.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 720).toISOString(),
  },
];

export const useOrganizationsList = () => {
  return useQuery({
    queryKey: ["organizations", "list"],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      return MOCK_ORGS;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useOrganizationDetail = (id: string) => {
  return useQuery({
    queryKey: ["organizations", "detail", id],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const org = MOCK_ORGS.find((o) => o.id === id);
      if (!org) throw new Error("Organization not found");
      return org;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
};
