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
import type { NormalizedPrincipal } from "../domain/identity/normalized-principal";

/**
 * Parameter decorator — extracts the NormalizedPrincipal from the request.
 *
 * Usage:
 *   @Get("me")
 *   getMe(@CurrentPrincipal() principal: NormalizedPrincipal) { ... }
 */
export const CurrentPrincipal = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): NormalizedPrincipal | undefined => {
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
    const principal: NormalizedPrincipal | undefined = request.principal;

    if (!principal || !principal.authenticated) {
      throw new UnauthorizedException("Authentication required");
    }

    return true;
  }
}
