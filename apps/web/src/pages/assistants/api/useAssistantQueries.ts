import { useQuery } from "@tanstack/react-query";
import { Assistant } from "../types";

const MOCK_ASSISTANTS: Assistant[] = [
  {
    id: "asst_01H1",
    name: "Fin-Sentry Alpha",
    internalCode: "AB-0912-F",
    type: "automation",
    status: "active",
    description:
      "Monitors Stripe clearing streams and routes anomalous transactional metadata to the security review channel.",
    organizationId: "org_finance_us",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    capabilities: [
      {
        id: "cap_1",
        name: "stripe:read_transactions",
        status: "allowed",
        category: "finance",
      },
      {
        id: "cap_2",
        name: "slack:post_message",
        status: "allowed",
        category: "slack",
      },
      {
        id: "cap_3",
        name: "stripe:refund",
        status: "denied",
        category: "finance",
      },
    ],
  },
  {
    id: "asst_01H2",
    name: "Build-Bot 7",
    internalCode: "AB-0442-E",
    type: "background",
    status: "pending",
    description:
      "Executes automated CI/CD sweeps and deployment rollbacks on approval.",
    organizationId: "org_engineering",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    capabilities: [
      {
        id: "cap_4",
        name: "github:create_pr",
        status: "allowed",
        category: "github",
      },
      {
        id: "cap_5",
        name: "aws:ecs_deploy",
        status: "pending",
        category: "aws",
      },
    ],
  },
  {
    id: "asst_01H3",
    name: "Cyber-Guard Prime",
    internalCode: "AB-1100-S",
    type: "automation",
    status: "restricted",
    description: "Analyzes cross-account IAM posture.",
    organizationId: "org_security",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    capabilities: [
      { id: "cap_6", name: "aws:iam_read", status: "allowed", category: "aws" },
      { id: "cap_7", name: "aws:iam_write", status: "denied", category: "aws" },
    ],
  },
  {
    id: "asst_01H4",
    name: "UX Insight Bot",
    internalCode: "AB-0321-D",
    type: "conversational",
    status: "active",
    description:
      "Summarizes UX feedback streams directly inside organization channels.",
    organizationId: "org_product",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    capabilities: [
      {
        id: "cap_8",
        name: "jira:read_tickets",
        status: "allowed",
        category: "internal",
      },
    ],
  },
];

export const useAssistantsList = () => {
  return useQuery({
    queryKey: ["assistants", "list"],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      return MOCK_ASSISTANTS;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useAssistantDetail = (id: string) => {
  return useQuery({
    queryKey: ["assistants", "detail", id],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const asst = MOCK_ASSISTANTS.find((a) => a.id === id);
      if (!asst) throw new Error("Assistant not found");
      return asst;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
};
