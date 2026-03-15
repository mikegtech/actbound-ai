import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { evaluatePermission } from "./engine";
import type { Permission } from "./permissions";
import type { AuthorizationContext, AuthorizationDecision } from "./types";

const REQUIRED_PERMISSION_KEY = "actbound:required-permission";

type RequestWithAuthorization = {
  authContext?: AuthorizationContext;
  permissionDecision?: AuthorizationDecision;
};

export const RequirePermission = (permission: Permission) =>
  SetMetadata(REQUIRED_PERMISSION_KEY, permission);

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permission = this.reflector.getAllAndOverride<Permission>(
      REQUIRED_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!permission) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<RequestWithAuthorization>();
    const authContext = request.authContext;

    if (!authContext) {
      throw new ForbiddenException({
        code: "auth_context_missing",
        message: "Authorization context was not attached to the request.",
      });
    }

    const decision = evaluatePermission(authContext, permission);
    request.permissionDecision = decision;

    if (!decision.allowed) {
      throw new ForbiddenException({
        code: "permission_denied",
        message: "Permission denied by centralized authorization policy.",
        details: {
          permission,
          reasons: decision.reasons,
        },
      });
    }

    return true;
  }
}
