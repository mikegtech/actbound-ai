/**
 * Resource Access Controller
 *
 * Business-level endpoints for managing and querying resource access.
 * Supports direct grants to users, assistants, and organizations,
 * plus inherited access via org membership and access explanation.
 *
 * NAMING: "assistant" = AI actor. "agent" is reserved for real estate domain.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { DecisionTraceEngine } from "../application/authz/decision-trace-engine";
import { buildExplainResult } from "../application/authz/graph-builder";
import { ResourceAccessService } from "../application/resource-access/resource-access.service";
import type { ResourceAccessView } from "../domain/relationships/types";

interface GrantUserAccessBody {
  id: string;
  accessLevel: "viewer" | "editor";
}

interface GrantAssistantAccessBody {
  id: string;
  accessLevel: "viewer" | "operator";
}

interface GrantOrgAccessBody {
  id: string;
  accessLevel: "viewer" | "editor";
}

@Controller("resources")
export class ResourceAccessController {
  constructor(
    private readonly accessService: ResourceAccessService,
    private readonly traceEngine: DecisionTraceEngine,
  ) {}

  // ── List all access for a resource ──────────────────────

  @Get(":resourceId/access")
  async getAccess(
    @Param("resourceId") resourceId: string,
  ): Promise<ResourceAccessView> {
    return this.accessService.getResourceAccess(resourceId);
  }

  // ── Grant access ────────────────────────────────────────

  @Post(":resourceId/access/users")
  @HttpCode(200)
  async grantUserAccess(
    @Param("resourceId") resourceId: string,
    @Body() body: GrantUserAccessBody,
  ) {
    return this.accessService.grantAccess({
      resourceId,
      subjectType: "user",
      subjectId: body.id,
      accessLevel: body.accessLevel,
    });
  }

  @Post(":resourceId/access/assistants")
  @HttpCode(200)
  async grantAssistantAccess(
    @Param("resourceId") resourceId: string,
    @Body() body: GrantAssistantAccessBody,
  ) {
    return this.accessService.grantAccess({
      resourceId,
      subjectType: "assistant",
      subjectId: body.id,
      accessLevel: body.accessLevel,
    });
  }

  @Post(":resourceId/access/organizations")
  @HttpCode(200)
  async grantOrgAccess(
    @Param("resourceId") resourceId: string,
    @Body() body: GrantOrgAccessBody,
  ) {
    return this.accessService.grantAccess({
      resourceId,
      subjectType: "organization",
      subjectId: body.id,
      accessLevel: body.accessLevel,
    });
  }

  // ── Revoke access ───────────────────────────────────────

  @Delete(":resourceId/access/users/:userId")
  @HttpCode(200)
  async revokeUserAccess(
    @Param("resourceId") resourceId: string,
    @Param("userId") userId: string,
  ) {
    return this.accessService.revokeAccess({
      resourceId,
      subjectType: "user",
      subjectId: userId,
    });
  }

  @Delete(":resourceId/access/assistants/:assistantId")
  @HttpCode(200)
  async revokeAssistantAccess(
    @Param("resourceId") resourceId: string,
    @Param("assistantId") assistantId: string,
  ) {
    return this.accessService.revokeAccess({
      resourceId,
      subjectType: "assistant",
      subjectId: assistantId,
    });
  }

  @Delete(":resourceId/access/organizations/:orgId")
  @HttpCode(200)
  async revokeOrgAccess(
    @Param("resourceId") resourceId: string,
    @Param("orgId") orgId: string,
  ) {
    return this.accessService.revokeAccess({
      resourceId,
      subjectType: "organization",
      subjectId: orgId,
    });
  }

  // ── Explain access ──────────────────────────────────────

  @Get(":resourceId/access/:entityType/:entityId/why")
  async explainAccess(
    @Param("resourceId") resourceId: string,
    @Param("entityType") entityType: string,
    @Param("entityId") entityId: string,
    @Query("action") action?: string,
  ) {
    const trace = await this.traceEngine.evaluate({
      subjectType: entityType as "user" | "assistant",
      subjectId: entityId,
      resourceType: "resource",
      resourceId,
      action: action ?? "viewer",
    });

    return buildExplainResult(trace);
  }

  // ── Access Graph ────────────────────────────────────────

  @Get(":resourceId/access/:entityType/:entityId/graph")
  async getAccessGraph(
    @Param("resourceId") resourceId: string,
    @Param("entityType") entityType: string,
    @Param("entityId") entityId: string,
    @Query("action") action?: string,
  ) {
    const trace = await this.traceEngine.evaluate({
      subjectType: entityType as "user" | "assistant",
      subjectId: entityId,
      resourceType: "resource",
      resourceId,
      action: action ?? "viewer",
    });

    const result = buildExplainResult(trace);
    return result.graph;
  }
}
