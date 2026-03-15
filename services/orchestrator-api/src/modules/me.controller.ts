import { evaluateAllPermissions } from "@actbound/authorization";
import { Controller, ForbiddenException, Get, Req } from "@nestjs/common";
import {
  toPermissionContextSummary,
  toPermissionDecisionRecord,
} from "@actbound/sdk";

import type { RequestWithAuthContext } from "../common/request-context";
import { DelegatedAccessService } from "../application/delegated-access/delegated-access.service";

@Controller("me")
export class MeController {
  constructor(
    private readonly delegatedAccessService: DelegatedAccessService,
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
}
