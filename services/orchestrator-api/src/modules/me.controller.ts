import {
  evaluateAllPermissions,
  PermissionGuard,
  RequirePermission,
} from "@actbound/authorization";
import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { toPermissionDecisionRecord } from "@actbound/sdk";

import type { RequestWithAuthContext } from "../common/request-context";

@Controller("me")
@UseGuards(PermissionGuard)
export class MeController {
  @Get("permissions")
  @RequirePermission("permissions:read")
  getPermissions(@Req() request: RequestWithAuthContext) {
    const authContext = request.authContext;

    return {
      decisions: authContext
        ? evaluateAllPermissions(authContext).map((decision) =>
            toPermissionDecisionRecord(decision, "orchestrator"),
          )
        : [],
    };
  }

  @Get("connections")
  @RequirePermission("connections:read")
  getConnections() {
    return {
      connections: [
        {
          id: "conn_demo_vault",
          provider: "auth0-token-vault",
          accountLabel: "Primary workspace vault connection",
          status: "connected" as const,
          scopes: ["connections.read", "agent.preview", "agent.execute"],
          lastSyncedAt: new Date().toISOString(),
        },
      ],
    };
  }
}
