import { useQuery } from "@tanstack/react-query";
import { Resource } from "../types";

const MOCK_RESOURCES: Resource[] = [
  {
    id: "res_111_rdmp",
    name: "FY24_Internal_Roadmap.pdf",
    category: "document",
    sensitivity: "normal",
    organizationId: "org_001_nc",
    organizationName: "NeuroCore Systems",
    description: "Strategic growth objectives for the core infrastructure.",
    assistantAccessCount: 5,
    lastAuditedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: "res_222_pg",
    name: "Payment_Gateway_v3",
    category: "api",
    sensitivity: "critical",
    organizationId: "org_003_qk",
    organizationName: "QuantKnot AI",
    description: "Production endpoint for external payment providers.",
    assistantAccessCount: 2,
    lastAuditedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "res_333_ec",
    name: "Edge_Compute_Node_04",
    category: "infrastructure",
    sensitivity: "high",
    organizationId: "org_002_va",
    organizationName: "Vanguard Aero",
    description: "Local processing cluster in Singapore Region.",
    assistantAccessCount: 18,
    lastAuditedAt: new Date(
      Date.now() - 1000 * 60 * 60 * 24 * 10,
    ).toISOString(),
  },
  {
    id: "res_444_la",
    name: "Legal_Archive_2023",
    category: "database",
    sensitivity: "high",
    organizationId: "org_001_nc",
    organizationName: "NeuroCore Systems",
    description: "Encrypted directory of compliance certifications.",
    assistantAccessCount: 0,
    lastAuditedAt: new Date(
      Date.now() - 1000 * 60 * 60 * 24 * 30,
    ).toISOString(),
  },
];

export const useResourcesList = () => {
  return useQuery({
    queryKey: ["resources", "list"],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      return MOCK_RESOURCES;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useResourceDetail = (id: string) => {
  return useQuery({
    queryKey: ["resources", "detail", id],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const res = MOCK_RESOURCES.find((o) => o.id === id);
      if (!res) throw new Error("Resource not found");
      return res;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
};
