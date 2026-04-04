/**
 * Relationship management domain types.
 *
 * NAMING CONVENTION:
 * - "assistant" = AI/platform actor in the business API surface
 * - "agent" = internal OpenFGA type name (kept for model compatibility)
 *
 * The service layer translates between these namespaces.
 */

/** Subject types in the business API. "assistant" maps to "agent" in OpenFGA. */
export type SubjectType = "user" | "assistant" | "organization";

/** Internal OpenFGA subject type. */
export type FgaSubjectType = "user" | "agent" | "organization";

/** Valid organization relations. */
export type OrgRelation = "member" | "admin";

/** Valid resource relations for users. */
export type UserResourceRelation = "viewer" | "editor";

/** Valid resource relations for assistants. */
export type AssistantResourceRelation = "viewer" | "operator";

/** Valid resource relations for organizations (org-level access). */
export type OrgResourceRelation = "viewer" | "editor";

/** All valid resource relations. */
export type ResourceRelation = "viewer" | "editor" | "operator";

/** Object types the relationship service manages. */
export type ObjectType = "organization" | "resource";

/** Access source for UI display. */
export type AccessSource = "direct" | "inherited";

export interface RelationshipRequest {
  subjectType: SubjectType;
  subjectId: string;
  relation: string;
  objectType: ObjectType;
  objectId: string;
}

export interface RelationshipResult {
  success: boolean;
  operation: "grant" | "revoke";
  subjectType: SubjectType;
  subjectId: string;
  relation: string;
  objectType: ObjectType;
  objectId: string;
  detail: "ok" | "already_exists" | "not_found" | "error";
  error?: string;
}

/** A single entry in the resource access list. */
export interface AccessEntry {
  subjectType: SubjectType;
  subjectId: string;
  accessLevel: ResourceRelation;
  source: AccessSource;
  grantedVia?: string; // e.g., "organization:acme" for inherited access
}

/** Full access view for a resource. */
export interface ResourceAccessView {
  resourceId: string;
  users: AccessEntry[];
  assistants: AccessEntry[];
  organizations: AccessEntry[];
}

/** Explanation of why access is granted. */
export interface AccessExplanation {
  subjectType: SubjectType;
  subjectId: string;
  resourceId: string;
  accessLevel: string;
  allowed: boolean;
  path: string[];
}

/** Maps business "assistant" to OpenFGA "agent". */
export function toFgaSubjectType(subjectType: SubjectType): FgaSubjectType {
  if (subjectType === "assistant") return "agent";
  return subjectType as FgaSubjectType;
}

/** Maps OpenFGA "agent" back to business "assistant". */
export function fromFgaSubjectType(fgaType: FgaSubjectType): SubjectType {
  if (fgaType === "agent") return "assistant";
  return fgaType as SubjectType;
}

const VALID_ORG_RELATIONS = new Set<string>(["member", "admin"]);
const VALID_USER_RESOURCE_RELATIONS = new Set<string>(["viewer", "editor"]);
const VALID_ASSISTANT_RESOURCE_RELATIONS = new Set<string>([
  "viewer",
  "operator",
]);
const VALID_ORG_RESOURCE_RELATIONS = new Set<string>(["viewer", "editor"]);

export function isValidRelation(
  objectType: ObjectType,
  relation: string,
  subjectType?: SubjectType,
): boolean {
  if (objectType === "organization") return VALID_ORG_RELATIONS.has(relation);

  if (objectType === "resource") {
    if (subjectType === "assistant")
      return VALID_ASSISTANT_RESOURCE_RELATIONS.has(relation);
    if (subjectType === "organization")
      return VALID_ORG_RESOURCE_RELATIONS.has(relation);
    return VALID_USER_RESOURCE_RELATIONS.has(relation);
  }

  return false;
}
