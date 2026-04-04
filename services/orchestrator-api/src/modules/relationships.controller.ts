/**
 * Relationship Management Controller
 *
 * Business-level endpoints for managing authorization relationships.
 * Users interact with organizations, resources, and assistants —
 * not raw OpenFGA tuples.
 *
 * NAMING: "assistant" = AI/platform actor. Maps to "agent" internally in OpenFGA.
 */

import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  Post,
} from "@nestjs/common";
import { RelationshipManagementService } from "../application/relationships/relationship-management.service";
import type { RelationshipResult } from "../domain/relationships/types";

// ── Request DTOs ─────────────────────────────────────────

interface GrantMembershipBody {
  userId: string;
}

interface GrantAssistantOrgBody {
  orgId: string;
}

interface GrantResourceAccessBody {
  userId?: string;
  assistantId?: string;
  relation: "viewer" | "editor";
}

// ── Organization Membership ──────────────────────────────

@Controller("organizations")
export class OrganizationMembershipController {
  constructor(private readonly relationships: RelationshipManagementService) {}

  @Post(":orgId/members")
  @HttpCode(200)
  async addMember(
    @Param("orgId") orgId: string,
    @Body() body: GrantMembershipBody,
  ): Promise<RelationshipResult> {
    return this.relationships.grant({
      subjectType: "user",
      subjectId: body.userId,
      relation: "member",
      objectType: "organization",
      objectId: orgId,
    });
  }

  @Delete(":orgId/members/:userId")
  @HttpCode(200)
  async removeMember(
    @Param("orgId") orgId: string,
    @Param("userId") userId: string,
  ): Promise<RelationshipResult> {
    return this.relationships.revoke({
      subjectType: "user",
      subjectId: userId,
      relation: "member",
      objectType: "organization",
      objectId: orgId,
    });
  }

  @Post(":orgId/admins")
  @HttpCode(200)
  async addAdmin(
    @Param("orgId") orgId: string,
    @Body() body: GrantMembershipBody,
  ): Promise<RelationshipResult> {
    return this.relationships.grant({
      subjectType: "user",
      subjectId: body.userId,
      relation: "admin",
      objectType: "organization",
      objectId: orgId,
    });
  }

  @Delete(":orgId/admins/:userId")
  @HttpCode(200)
  async removeAdmin(
    @Param("orgId") orgId: string,
    @Param("userId") userId: string,
  ): Promise<RelationshipResult> {
    return this.relationships.revoke({
      subjectType: "user",
      subjectId: userId,
      relation: "admin",
      objectType: "organization",
      objectId: orgId,
    });
  }
}

// ── Assistant Organization Assignment ────────────────────

@Controller("assistants")
export class AssistantRelationshipController {
  constructor(private readonly relationships: RelationshipManagementService) {}

  @Post(":assistantId/organizations")
  @HttpCode(200)
  async assignToOrg(
    @Param("assistantId") assistantId: string,
    @Body() body: GrantAssistantOrgBody,
  ): Promise<RelationshipResult> {
    return this.relationships.grant({
      subjectType: "assistant",
      subjectId: assistantId,
      relation: "member",
      objectType: "organization",
      objectId: body.orgId,
    });
  }

  @Delete(":assistantId/organizations/:orgId")
  @HttpCode(200)
  async removeFromOrg(
    @Param("assistantId") assistantId: string,
    @Param("orgId") orgId: string,
  ): Promise<RelationshipResult> {
    return this.relationships.revoke({
      subjectType: "assistant",
      subjectId: assistantId,
      relation: "member",
      objectType: "organization",
      objectId: orgId,
    });
  }
}

// ── Resource Access ──────────────────────────────────────

@Controller("resources")
export class ResourceAccessController {
  constructor(private readonly relationships: RelationshipManagementService) {}

  @Post(":resourceId/access/users")
  @HttpCode(200)
  async grantUserAccess(
    @Param("resourceId") resourceId: string,
    @Body() body: GrantResourceAccessBody,
  ): Promise<RelationshipResult> {
    return this.relationships.grant({
      subjectType: "user",
      subjectId: body.userId!,
      relation: body.relation,
      objectType: "resource",
      objectId: resourceId,
    });
  }

  @Delete(":resourceId/access/users/:userId")
  @HttpCode(200)
  async revokeUserAccess(
    @Param("resourceId") resourceId: string,
    @Param("userId") userId: string,
  ): Promise<RelationshipResult> {
    // Revoke viewer — the service handles idempotency for non-existent relations
    return this.relationships.revoke({
      subjectType: "user",
      subjectId: userId,
      relation: "viewer",
      objectType: "resource",
      objectId: resourceId,
    });
  }

  @Post(":resourceId/access/assistants")
  @HttpCode(200)
  async grantAssistantAccess(
    @Param("resourceId") resourceId: string,
    @Body() body: GrantResourceAccessBody,
  ): Promise<RelationshipResult> {
    return this.relationships.grant({
      subjectType: "assistant",
      subjectId: body.assistantId!,
      relation: body.relation,
      objectType: "resource",
      objectId: resourceId,
    });
  }

  @Delete(":resourceId/access/assistants/:assistantId")
  @HttpCode(200)
  async revokeAssistantAccess(
    @Param("resourceId") resourceId: string,
    @Param("assistantId") assistantId: string,
  ): Promise<RelationshipResult> {
    return this.relationships.revoke({
      subjectType: "assistant",
      subjectId: assistantId,
      relation: "viewer",
      objectType: "resource",
      objectId: resourceId,
    });
  }
}
