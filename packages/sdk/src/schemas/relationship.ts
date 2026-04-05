import { z } from "../openapi/extend-zod";

export const RelationshipResultSchema = z
  .object({
    success: z.boolean(),
    operation: z.enum(["grant", "revoke"]),
    subjectType: z.enum(["user", "assistant", "organization"]),
    subjectId: z.string(),
    relation: z.string(),
    objectType: z.enum(["organization", "resource"]),
    objectId: z.string(),
    detail: z.enum(["ok", "already_exists", "not_found", "error"]),
    error: z.string().optional(),
  })
  .openapi("RelationshipResult");

export const AccessEntrySchema = z.object({
  subjectType: z.enum(["user", "assistant", "organization"]),
  subjectId: z.string(),
  accessLevel: z.string(),
  source: z.enum(["direct", "inherited"]),
  grantedVia: z.string().optional(),
});

export const ResourceAccessViewSchema = z
  .object({
    resourceId: z.string(),
    users: z.array(AccessEntrySchema),
    assistants: z.array(AccessEntrySchema),
    organizations: z.array(AccessEntrySchema),
  })
  .openapi("ResourceAccessView");

export const AccessGrantResultSchema = z.object({
  success: z.boolean(),
  operation: z.string(),
  subjectType: z.string(),
  subjectId: z.string(),
  accessLevel: z.string(),
  resourceId: z.string(),
  detail: z.string(),
});

export const PathStepSchema = z.object({
  icon: z.enum(["identity", "membership", "permission", "result", "policy"]),
  title: z.string(),
  subtitle: z.string(),
});

export const GraphNodeSchema = z.object({
  id: z.string(),
  type: z.enum(["user", "assistant", "organization", "resource", "decision"]),
  label: z.string(),
  meta: z.record(z.string()).optional(),
});

export const GraphEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  relation: z.string(),
  primary: z.boolean().optional(),
});

export const ExplainResultSchema = z
  .object({
    summary: z.string(),
    graph: z.object({
      nodes: z.array(GraphNodeSchema),
      edges: z.array(GraphEdgeSchema),
    }),
    trace: z.object({
      requestId: z.string(),
      action: z.string(),
      finalDecision: z.string(),
      steps: z.array(
        z.object({
          layer: z.string(),
          result: z.string(),
          reason: z.string(),
        }),
      ),
    }),
    path: z.array(PathStepSchema),
  })
  .openapi("ExplainResult");

export type RelationshipResult = z.infer<typeof RelationshipResultSchema>;
export type AccessEntry = z.infer<typeof AccessEntrySchema>;
export type ResourceAccessView = z.infer<typeof ResourceAccessViewSchema>;
export type AccessGrantResult = z.infer<typeof AccessGrantResultSchema>;
export type ExplainResult = z.infer<typeof ExplainResultSchema>;
export type PathStep = z.infer<typeof PathStepSchema>;
export type GraphNode = z.infer<typeof GraphNodeSchema>;
export type GraphEdge = z.infer<typeof GraphEdgeSchema>;
