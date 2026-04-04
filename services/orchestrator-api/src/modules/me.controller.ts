import {
  evaluateAllPermissions,
  evaluateAuditViewing,
} from "@actbound/authorization";
import { Controller, ForbiddenException, Get, Req } from "@nestjs/common";
import {
  toPermissionContextSummary,
  toPermissionDecisionRecord,
} from "@actbound/sdk";

import type { RequestWithAuthContext } from "../common/request-context";
import { DelegatedAccessService } from "../application/delegated-access/delegated-access.service";
import { AuditEventStore } from "../domain/audit/audit-event.store";

@Controller("me")
export class MeController {
  constructor(
    private readonly delegatedAccessService: DelegatedAccessService,
    private readonly auditStore: AuditEventStore,
  ) {}

  @Get("permissions")
  getPermissions(@Req() request: RequestWithAuthContext) {
    const authContext = request.authContext;

    if (!authContext) {
      throw new ForbiddenException({
        code: "auth_context_missing",
        message: "Authorization context was not attached to the request.",
      });
    }

    return {
      context: toPermissionContextSummary(authContext),
      decisions: evaluateAllPermissions(authContext).map((decision) =>
        toPermissionDecisionRecord(decision, "orchestrator"),
      ),
    };
  }

  @Get("connections")
  getConnections(@Req() request: RequestWithAuthContext) {
    const authContext = request.authContext;

    if (!authContext) {
      throw new ForbiddenException({
        code: "auth_context_missing",
        message: "Authorization context was not attached to the request.",
      });
    }

    const delegatedConnections =
      this.delegatedAccessService.getConnections(authContext);

    if (!delegatedConnections.decision.allowed) {
      throw new ForbiddenException({
        code: "permission_denied",
        message:
          "Connection metadata is not available for the current context.",
        details: {
          permission: delegatedConnections.decision.permission,
          reasons: delegatedConnections.decision.reasons,
        },
      });
    }

    return {
      connections: delegatedConnections.data.connections.map((connection) => ({
        id: connection.id,
        provider: connection.provider,
        accountLabel: connection.accountLabel,
        status:
          connection.status === "connected" ? "connected" : "disconnected",
        scopes: connection.grantedScopes,
        lastSyncedAt: connection.lastSyncedAt,
      })),
    };
  }

  @Get("activity")
  getActivity(@Req() request: RequestWithAuthContext) {
    const authContext = request.authContext;

    if (!authContext) {
      throw new ForbiddenException({
        code: "auth_context_missing",
        message: "Authorization context was not attached to the request.",
      });
    }

    const decision = evaluateAuditViewing(authContext, {
      type: "audit_event",
      ownerSubjectId: authContext.subject.id,
    });

    if (!decision.allowed) {
      throw new ForbiddenException({
        code: "permission_denied",
        message: "Activity timeline is not available for the current context.",
        details: {
          permission: decision.permission,
          reasons: decision.reasons,
        },
      });
    }

    // Seed demo events on first access
    this.auditStore.seedDemoEvents(authContext.actor.id);

    const events = this.auditStore.listByActor(authContext.actor.id);

    return {
      entries: this.auditStore.toTimeline(events),
      total: events.length,
    };
  }

  @Get("control-summary")
  getControlSummary(@Req() request: RequestWithAuthContext) {
    const authContext = request.authContext;

    if (!authContext) {
      throw new ForbiddenException({
        code: "auth_context_missing",
        message: "Authorization context was not attached to the request.",
      });
    }

    const allDecisions = evaluateAllPermissions(authContext);
    const allowed = allDecisions.filter((d) => d.allowed).length;

    const delegatedConnections =
      this.delegatedAccessService.getConnections(authContext);
    const connectedAccounts = delegatedConnections.decision.allowed
      ? delegatedConnections.data.connections.filter(
          (c) => c.status === "connected",
        ).length
      : 0;

    const consents = this.delegatedAccessService.getConsents(authContext);
    const activeGrants = consents.decision.allowed
      ? consents.data.consents.filter(
          (s: { status: string }) => s.status === "granted",
        ).length
      : 0;

    const stats = this.auditStore.getStats(authContext.actor.id);

    return {
      permissionsSummary: {
        total: allDecisions.length,
        allowed,
        denied: allDecisions.length - allowed,
      },
      connectedAccounts,
      activeGrants,
      recentActivity: stats.recentActivity,
      revocations: stats.revocations,
    };
  }
}
