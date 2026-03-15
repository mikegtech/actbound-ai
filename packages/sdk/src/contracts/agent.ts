import type { ApiRouteContract } from "./types";
import {
  HealthStatusSchema,
  ListingParamsSchema,
  ListingSchema,
  StandardApiErrorSchema,
  ValuationExecuteRequestSchema,
  ValuationExecuteResultSchema,
} from "../schemas";

export const agentRoutes = {
  health: {
    method: "get",
    path: "/health",
    summary: "Service health status",
    operationId: "getAgentHealth",
    tags: ["Health"],
    responses: {
      200: {
        description: "Agent service health status",
        schema: HealthStatusSchema,
      },
    },
  },
  executeValuation: {
    method: "post",
    path: "/valuations/execute",
    summary: "Execute a protected valuation operation",
    operationId: "executeValuation",
    tags: ["Valuations"],
    request: {
      body: ValuationExecuteRequestSchema,
    },
    responses: {
      200: {
        description: "Valuation execution result",
        schema: ValuationExecuteResultSchema,
      },
      403: {
        description: "Permission denied",
        schema: StandardApiErrorSchema,
      },
    },
  },
  getListing: {
    method: "get",
    path: "/listings/{id}",
    summary: "Fetch a listing",
    operationId: "getListing",
    tags: ["Listings"],
    request: {
      params: ListingParamsSchema,
    },
    responses: {
      200: {
        description: "Listing details",
        schema: ListingSchema,
      },
      403: {
        description: "Permission denied",
        schema: StandardApiErrorSchema,
      },
      404: {
        description: "Listing not found",
        schema: StandardApiErrorSchema,
      },
    },
  },
} satisfies Record<string, ApiRouteContract>;

export const agentRouteList = Object.values(agentRoutes);
