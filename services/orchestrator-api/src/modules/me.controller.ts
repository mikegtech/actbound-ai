import {
  evaluateAllPermissions,
  evaluatePermission,
} from "@actbound/authorization";
import { Controller, ForbiddenException, Get, Req } from "@nestjs/common";
import {
  toPermissionContextSummary,
  toPermissionDecisionRecord,
} from "@actbound/sdk";

import type { RequestWithAuthContext } from "../common/request-context";

@Controller("me")
export class MeController {
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

    const decision = evaluatePermission(authContext, "connections:read", {
      type: "vault_connection",
      id: authContext.tokenVaultConnection.connectionId,
    });

    if (!decision.allowed) {
      throw new ForbiddenException({
        code: "permission_denied",
        message:
          "Connection metadata is not available for the current context.",
        details: {
          permission: decision.permission,
          reasons: decision.reasons,
        },
      });
    }

    if (
      !authContext.tokenVaultConnection.connectionId ||
      authContext.tokenVaultConnection.status === "missing"
    ) {
      return {
        connections: [],
      };
    }

    return {
      connections: [
        {
          id: authContext.tokenVaultConnection.connectionId,
          provider:
            authContext.tokenVaultConnection.provider ?? "auth0-token-vault",
          accountLabel: "Token Vault connection for the active subject",
          status: authContext.tokenVaultConnection.status,
          scopes: authContext.tokenVaultConnection.scopes,
          lastSyncedAt: new Date().toISOString(),
        },
      ],
    };
  }
}
