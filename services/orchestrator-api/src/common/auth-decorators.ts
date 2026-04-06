/**
 * Auth decorators for NestJS controllers.
 *
 * @CurrentPrincipal — extracts the normalized principal from the request
 * @RequireAuthenticated — guard that rejects unauthenticated requests
 */

import {
  createParamDecorator,
  type ExecutionContext,
  UnauthorizedException,
  type CanActivate,
  Injectable,
} from "@nestjs/common";
import type { Principal } from "../domain/identity/principal";

/**
 * Parameter decorator — extracts the Principal from the request.
 *
 * Usage:
 *   @Get("me")
 *   getMe(@CurrentPrincipal() principal: Principal) { ... }
 */
export const CurrentPrincipal = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Principal | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.principal;
  },
);

/**
 * Guard — rejects requests without an authenticated principal.
 *
 * Usage:
 *   @UseGuards(AuthenticatedGuard)
 *   @Get("secure")
 *   secureEndpoint() { ... }
 */
@Injectable()
export class AuthenticatedGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const request = ctx.switchToHttp().getRequest();
    const principal: Principal | undefined = request.principal;

    if (!principal || !principal.authenticated) {
      throw new UnauthorizedException("Authentication required");
    }

    return true;
  }
}
