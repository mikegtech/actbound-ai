/**
 * JWT Authentication Middleware
 *
 * Validates Auth0 JWTs from the Authorization header using `jose`.
 * Extracts a normalized Principal and attaches it to the request.
 *
 * Behavior:
 * - If a valid Bearer token is present → extract principal from JWT claims
 * - If no token or invalid token → attach demo principal (fail-open for dev)
 * - The downstream AuthorizationContextMiddleware uses the principal
 *
 * For production: change to fail-closed (reject without valid token).
 * Currently: demo fallback allows the app to work without Auth0 configured.
 */

import { Injectable, Logger, type NestMiddleware } from "@nestjs/common";
import * as jose from "jose";
import type { NextFunction, Response } from "express";
import {
  principalFromClaims,
  demoPrincipal,
  type Principal,
} from "../domain/identity/principal";

export type RequestWithPrincipal = {
  principal?: Principal;
};

let jwksCache: ReturnType<typeof jose.createRemoteJWKSet> | null = null;

function getJwks(domain: string) {
  if (!jwksCache) {
    jwksCache = jose.createRemoteJWKSet(
      new URL(`https://${domain}/.well-known/jwks.json`),
    );
  }
  return jwksCache;
}

@Injectable()
export class JwtAuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(JwtAuthMiddleware.name);
  private readonly domain = process.env.AUTH0_DOMAIN ?? "";
  private readonly audience =
    process.env.AUTH0_AUDIENCE ?? "https://api.actbound.dev";
  private readonly issuer = this.domain ? `https://${this.domain}/` : "";

  async use(
    request: RequestWithPrincipal & {
      headers: Record<string, string | undefined>;
    },
    _response: Response,
    next: NextFunction,
  ) {
    const authHeader =
      request.headers.authorization ?? request.headers.Authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No token — use demo principal
      request.principal = demoPrincipal();
      return next();
    }

    if (!this.domain) {
      // Auth0 not configured — use demo principal with the token's sub if parseable
      this.logger.warn("AUTH0_DOMAIN not set — using demo principal");
      request.principal = demoPrincipal();
      return next();
    }

    const token = authHeader.slice(7);

    try {
      const jwks = getJwks(this.domain);

      const { payload } = await jose.jwtVerify(token, jwks, {
        issuer: this.issuer,
        audience: this.audience,
      });

      request.principal = principalFromClaims(
        payload as Record<string, unknown>,
      );

      this.logger.debug(
        `Authenticated: ${request.principal.sub} (${request.principal.principalType})`,
      );
    } catch (err) {
      // JWT validation failed — demo fallback until Auth0 Universal Login is wired
      this.logger.warn(
        `JWT validation failed: ${err instanceof Error ? err.message : String(err)}`,
      );

      // TODO: Remove demo fallback when Auth0 login is fully wired
      // TODO: Change to throw UnauthorizedException for production
      request.principal = demoPrincipal({ sub: "unauthenticated" });
    }

    next();
  }
}
