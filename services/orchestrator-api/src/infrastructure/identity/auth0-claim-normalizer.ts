import { Injectable } from "@nestjs/common";
import type {
  ClaimNormalizer,
  NormalizedClaims,
  RawTokenClaims,
} from "../../domain/identity/claim-normalizer";
import type { PrincipalType } from "../../domain/identity/principal";
import type { IssuerType } from "../../domain/identity/issuer-types";

/**
 * Auth0 claim normalizer.
 *
 * Extracts claims from Auth0 JWTs using the `https://actbound.ai/` namespace.
 * Custom claims are injected by the `actbound-post-login-enrich` and
 * `actbound-m2m-enrich` Auth0 Actions.
 */
@Injectable()
export class Auth0ClaimNormalizer implements ClaimNormalizer {
  readonly issuerType: IssuerType = "auth0";

  normalize(input: RawTokenClaims): NormalizedClaims {
    const { payload, issuer, issuerType, profile } = input;

    const sub = String(payload.sub ?? "unknown");

    return {
      externalSub: sub,
      issuer,
      issuerType,
      principalType: this.parsePrincipalType(
        this.getClaim(payload, profile.principalTypeClaim),
        sub,
      ),
      tenantId: String(
        this.getClaim(payload, profile.tenantIdClaim) ?? "default",
      ),
      roles: this.parseRoles(this.getClaim(payload, profile.rolesClaim), sub),
      clientId: payload.azp ? String(payload.azp) : undefined,
      onBehalfOf: profile.onBehalfOfClaim
        ? this.getStringClaim(payload, profile.onBehalfOfClaim)
        : undefined,
      agentType: profile.agentTypeClaim
        ? this.getStringClaim(payload, profile.agentTypeClaim)
        : undefined,
      agentInstanceId: profile.agentInstanceIdClaim
        ? this.getStringClaim(payload, profile.agentInstanceIdClaim)
        : undefined,
      serviceName: profile.serviceNameClaim
        ? this.getStringClaim(payload, profile.serviceNameClaim)
        : undefined,
    };
  }

  private getClaim(
    payload: Record<string, unknown>,
    claimPath: string,
  ): unknown {
    // Try exact key first (handles URL-based keys like "https://actbound.ai/roles")
    if (claimPath in payload) {
      return payload[claimPath];
    }

    // Fall back to dot-separated path traversal (e.g., "realm_access.roles")
    const parts = claimPath.split(".");
    let current: unknown = payload;
    for (const part of parts) {
      if (current == null || typeof current !== "object") return undefined;
      current = (current as Record<string, unknown>)[part];
    }
    return current;
  }

  private getStringClaim(
    payload: Record<string, unknown>,
    claimPath: string,
  ): string | undefined {
    const value = this.getClaim(payload, claimPath);
    return value != null ? String(value) : undefined;
  }

  private parsePrincipalType(value: unknown, sub: string): PrincipalType {
    if (value === "user" || value === "service" || value === "agent") {
      return value;
    }
    if (sub.endsWith("@clients")) return "service";
    return "user";
  }

  private parseRoles(value: unknown, sub: string): string[] {
    if (Array.isArray(value)) return value as string[];
    if (sub.endsWith("@clients")) return ["service"];
    return ["viewer"];
  }
}
