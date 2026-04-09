/**
 * JWT Authentication Middleware — Multi-Issuer, Fail-Closed
 *
 * Validates JWTs from any trusted OIDC issuer. Performs:
 * 1. Extract token from Authorization header
 * 2. Decode token header to get issuer
 * 3. Look up issuer in trusted issuer registry
 * 4. Validate signature via issuer-specific JWKS
 * 5. Normalize claims via ClaimNormalizationService
 * 6. Resolve identity binding (issuer+sub → internal subject)
 * 7. Attach NormalizedPrincipal to request
 *
 * Fail-closed: any step failure → 401 Unauthorized. No demo fallback.
 */

import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
  type NestMiddleware,
} from "@nestjs/common";
import * as jose from "jose";
import type { NextFunction, Response } from "express";
import type { NormalizedPrincipal } from "../domain/identity/normalized-principal";
import type { TrustedIssuer } from "../domain/identity/issuer-types";
import type { TrustedIssuerRepository } from "../domain/identity/trusted-issuer-repository";
import { ClaimNormalizationService } from "../application/identity/claim-normalization.service";
import { IdentityBindingService } from "../application/identity/identity-binding.service";

export type RequestWithPrincipal = {
  principal?: NormalizedPrincipal;
};

/** Cache JWKS endpoints by issuer URL to avoid repeated discovery. */
const jwksCache = new Map<string, ReturnType<typeof jose.createRemoteJWKSet>>();

function getJwks(jwksUrl: string): ReturnType<typeof jose.createRemoteJWKSet> {
  let jwks = jwksCache.get(jwksUrl);
  if (!jwks) {
    jwks = jose.createRemoteJWKSet(new URL(jwksUrl));
    jwksCache.set(jwksUrl, jwks);
  }
  return jwks;
}

@Injectable()
export class JwtAuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(JwtAuthMiddleware.name);

  constructor(
    @Inject("TRUSTED_ISSUER_REPOSITORY")
    private readonly issuerRepository: TrustedIssuerRepository,
    private readonly claimNormalization: ClaimNormalizationService,
    private readonly identityBinding: IdentityBindingService,
  ) {}

  async use(
    request: RequestWithPrincipal & {
      headers: Record<string, string | undefined>;
    },
    _response: Response,
    next: NextFunction,
  ) {
    const authHeader =
      request.headers.authorization ?? request.headers.Authorization;

    // Step 1: Extract token — fail-closed if missing
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException(
        "Missing or invalid Authorization header",
      );
    }

    const token = authHeader.slice(7);

    try {
      // Step 2: Decode token header to get issuer (without verification)
      const decoded = jose.decodeJwt(token);
      const issuerUrl = decoded.iss;

      if (!issuerUrl) {
        throw new UnauthorizedException("Token missing iss claim");
      }

      // Step 3: Look up issuer in registry
      const trustedIssuer = await this.resolveIssuer(issuerUrl);
      if (!trustedIssuer) {
        this.logger.warn(`Untrusted issuer: ${issuerUrl}`);
        throw new UnauthorizedException("Issuer not trusted");
      }

      // Step 4: Validate signature via issuer-specific JWKS
      const jwksUrl =
        trustedIssuer.jwksUrl ?? `${issuerUrl}.well-known/jwks.json`;

      const jwks = getJwks(jwksUrl);

      const { payload } = await jose.jwtVerify(token, jwks, {
        issuer: issuerUrl,
        audience: trustedIssuer.audience ?? undefined,
      });

      // Step 5: Normalize claims
      const normalizedClaims = this.claimNormalization.normalize(
        trustedIssuer.issuerType,
        issuerUrl,
        trustedIssuer.claimMappingProfile,
        payload as Record<string, unknown>,
      );

      // Step 6: Resolve identity binding
      const binding = await this.identityBinding.resolveOrCreate({
        issuer: issuerUrl,
        externalSub: normalizedClaims.externalSub,
        issuerType: trustedIssuer.issuerType,
        tenantId: normalizedClaims.tenantId,
        displayName: undefined, // Could be extracted from ID token
        email: undefined,
      });

      // Step 7: Build NormalizedPrincipal
      const principal: NormalizedPrincipal = {
        internalSubjectId: binding.internalSubjectId,
        externalSub: normalizedClaims.externalSub,
        issuer: issuerUrl,
        issuerType: trustedIssuer.issuerType,
        principalType: normalizedClaims.principalType,
        tenantId: normalizedClaims.tenantId,
        roles: normalizedClaims.roles,
        clientId: normalizedClaims.clientId,
        onBehalfOf: normalizedClaims.onBehalfOf,
        agentType: normalizedClaims.agentType,
        agentInstanceId: normalizedClaims.agentInstanceId,
        serviceName: normalizedClaims.serviceName,
        identitySource: {
          provider: trustedIssuer.issuerType,
          issuerLabel: trustedIssuer.displayName,
          issuerUrl,
        },
        authenticated: true,
      };

      request.principal = principal;

      this.logger.debug(
        `Authenticated: ${principal.externalSub} → ${principal.internalSubjectId} ` +
          `(${principal.principalType}, ${trustedIssuer.issuerType})`,
      );
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }

      this.logger.warn(
        `JWT validation failed: ${err instanceof Error ? err.message : String(err)}`,
      );

      throw new UnauthorizedException("Invalid or expired token");
    }

    next();
  }

  /**
   * Resolve issuer from registry. Tries global lookup first
   * (we don't know the tenant until claims are decoded).
   */
  private async resolveIssuer(
    issuerUrl: string,
  ): Promise<TrustedIssuer | null> {
    return this.issuerRepository.findByIssuerUrlGlobal(issuerUrl);
  }
}
