/**
 * Resource Access Service
 *
 * Manages resource-level access control through OpenFGA.
 * Supports direct user/assistant/organization grants, inherited access
 * via org membership, and access explanation.
 *
 * NAMING: "assistant" in API → "agent" in OpenFGA tuples.
 */

import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from "@nestjs/common";
import type { RelationshipWriter } from "@actbound/openfga";
import {
  type AccessEntry,
  type AccessExplanation,
  type ResourceAccessView,
  type ResourceRelation,
  type SubjectType,
  isValidRelation,
  toFgaSubjectType,
} from "../../domain/relationships/types";

interface GrantAccessInput {
  resourceId: string;
  subjectType: SubjectType;
  subjectId: string;
  accessLevel: ResourceRelation;
}

interface RevokeAccessInput {
  resourceId: string;
  subjectType: SubjectType;
  subjectId: string;
}

@Injectable()
export class ResourceAccessService {
  private readonly logger = new Logger(ResourceAccessService.name);

  constructor(
    @Inject("RELATIONSHIP_WRITER") private readonly writer: RelationshipWriter,
  ) {}

  // ── Grant ───────────────────────────────────────────────

  async grantAccess(input: GrantAccessInput) {
    if (!isValidRelation("resource", input.accessLevel, input.subjectType)) {
      throw new BadRequestException(
        `Invalid access level "${input.accessLevel}" for ${input.subjectType} on resource. ` +
          `Users support: viewer, editor. Assistants support: viewer, operator. Organizations support: viewer, editor.`,
      );
    }

    const fgaUser =
      input.subjectType === "organization"
        ? `${input.subjectType}:${input.subjectId}`
        : `${toFgaSubjectType(input.subjectType)}:${input.subjectId}`;

    const result = await this.writer.write({
      user: fgaUser,
      relation: input.accessLevel,
      object: `resource:${input.resourceId}`,
    });

    this.logger.log(
      JSON.stringify({
        event: "resource_access.grant",
        resource_id: input.resourceId,
        subject_type: input.subjectType,
        subject_id: input.subjectId,
        relation: input.accessLevel,
        operation: "grant",
        result: result.result,
      }),
    );

    return {
      success: result.result === "ok" || result.result === "already_exists",
      operation: "grant" as const,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      accessLevel: input.accessLevel,
      resourceId: input.resourceId,
      detail: result.result,
    };
  }

  // ── Revoke ──────────────────────────────────────────────

  async revokeAccess(input: RevokeAccessInput) {
    const fgaUser =
      input.subjectType === "organization"
        ? `${input.subjectType}:${input.subjectId}`
        : `${toFgaSubjectType(input.subjectType)}:${input.subjectId}`;

    // Remove all possible relations for this subject (idempotent)
    const relations =
      input.subjectType === "assistant"
        ? ["viewer", "operator"]
        : ["viewer", "editor"];

    const results = await Promise.all(
      relations.map((relation) =>
        this.writer.delete({
          user: fgaUser,
          relation,
          object: `resource:${input.resourceId}`,
        }),
      ),
    );

    const anyOk = results.some(
      (r) => r.result === "ok" || r.result === "not_found",
    );

    this.logger.log(
      JSON.stringify({
        event: "resource_access.revoke",
        resource_id: input.resourceId,
        subject_type: input.subjectType,
        subject_id: input.subjectId,
        operation: "revoke",
        result: anyOk ? "ok" : "error",
      }),
    );

    return {
      success: anyOk,
      operation: "revoke" as const,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      resourceId: input.resourceId,
      detail: anyOk ? ("ok" as const) : ("error" as const),
    };
  }

  // ── List Access ─────────────────────────────────────────

  async getResourceAccess(resourceId: string): Promise<ResourceAccessView> {
    const object = `resource:${resourceId}`;

    // Read all tuples for this resource
    const allTuples = await this.writer.readTuples(object);

    const users: AccessEntry[] = [];
    const assistants: AccessEntry[] = [];
    const organizations: AccessEntry[] = [];

    // Track which orgs have access for inherited calculation
    const orgAccessMap = new Map<string, ResourceRelation>();

    for (const tuple of allTuples) {
      const [fgaType, id] = this.parseSubject(tuple.user);
      const relation = tuple.relation as ResourceRelation;

      if (fgaType === "user") {
        users.push({
          subjectType: "user",
          subjectId: id,
          accessLevel: relation,
          source: "direct",
        });
      } else if (fgaType === "agent") {
        assistants.push({
          subjectType: "assistant",
          subjectId: id,
          accessLevel: relation,
          source: "direct",
        });
      } else if (fgaType === "organization") {
        organizations.push({
          subjectType: "organization",
          subjectId: id,
          accessLevel: relation,
          source: "direct",
        });
        orgAccessMap.set(id, relation);
      }
    }

    // Calculate inherited access: users who are members of orgs that have access
    for (const [orgId, orgRelation] of orgAccessMap) {
      const orgMembers = await this.writer.readTuples(`organization:${orgId}`);

      for (const memberTuple of orgMembers) {
        const [memberType, memberId] = this.parseSubject(memberTuple.user);

        // Only users get inherited access (assistants need direct grants)
        if (memberType !== "user") continue;

        // Skip if user already has direct access at this or higher level
        const existingDirect = users.find(
          (u) => u.subjectId === memberId && u.source === "direct",
        );
        if (existingDirect) continue;

        // Skip if already inherited at same or higher level
        const existingInherited = users.find(
          (u) =>
            u.subjectId === memberId &&
            u.source === "inherited" &&
            u.accessLevel === orgRelation,
        );
        if (existingInherited) continue;

        // Inherited access level matches the org's access level
        // org=viewer → member gets viewer
        // org=editor → member gets editor (via model inheritance)
        users.push({
          subjectType: "user",
          subjectId: memberId,
          accessLevel: orgRelation,
          source: "inherited",
          grantedVia: `organization:${orgId}`,
        });
      }
    }

    return { resourceId, users, assistants, organizations };
  }

  // ── Explain Access ──────────────────────────────────────

  async explainAccess(
    resourceId: string,
    entityType: SubjectType,
    entityId: string,
  ): Promise<AccessExplanation> {
    const fgaUser =
      entityType === "organization"
        ? `organization:${entityId}`
        : `${toFgaSubjectType(entityType)}:${entityId}`;

    // Check direct access
    for (const relation of ["viewer", "editor", "operator"]) {
      const allowed = await this.writer.check({
        user: fgaUser,
        relation,
        object: `resource:${resourceId}`,
      });

      if (allowed) {
        // Determine if direct or inherited
        const directTuples = await this.writer.readTuples(
          `resource:${resourceId}`,
          relation,
        );
        const isDirect = directTuples.some((t) => t.user === fgaUser);

        if (isDirect) {
          return {
            subjectType: entityType,
            subjectId: entityId,
            resourceId,
            accessLevel: relation,
            allowed: true,
            path: [
              `${entityType}:${entityId} has direct "${relation}" on resource:${resourceId}`,
            ],
          };
        }

        // Must be inherited via org
        if (entityType === "user") {
          const explanation = await this.findInheritedPath(
            entityId,
            resourceId,
            relation,
          );
          if (explanation.length > 0) {
            return {
              subjectType: entityType,
              subjectId: entityId,
              resourceId,
              accessLevel: relation,
              allowed: true,
              path: explanation,
            };
          }
        }
      }
    }

    return {
      subjectType: entityType,
      subjectId: entityId,
      resourceId,
      accessLevel: "none",
      allowed: false,
      path: [
        `${entityType}:${entityId} has no access to resource:${resourceId}`,
      ],
    };
  }

  // ── Private Helpers ─────────────────────────────────────

  private async findInheritedPath(
    userId: string,
    resourceId: string,
    relation: string,
  ): Promise<string[]> {
    // Find all orgs that have access to this resource
    const resourceTuples = await this.writer.readTuples(
      `resource:${resourceId}`,
    );

    for (const tuple of resourceTuples) {
      const [type, orgId] = this.parseSubject(tuple.user);
      if (type !== "organization") continue;

      // Check if user is a member of this org
      const orgTuples = await this.writer.readTuples(`organization:${orgId}`);
      const isMember = orgTuples.some((t) => t.user === `user:${userId}`);

      if (isMember) {
        const memberRelation =
          orgTuples.find((t) => t.user === `user:${userId}`)?.relation ??
          "member";
        return [
          `user:${userId} is "${memberRelation}" of organization:${orgId}`,
          `organization:${orgId} has "${tuple.relation}" on resource:${resourceId}`,
          `→ user:${userId} inherits "${relation}" access`,
        ];
      }
    }

    return [];
  }

  private parseSubject(fgaUser: string): [string, string] {
    const colonIndex = fgaUser.indexOf(":");
    if (colonIndex === -1) return ["unknown", fgaUser];
    return [fgaUser.slice(0, colonIndex), fgaUser.slice(colonIndex + 1)];
  }
}
