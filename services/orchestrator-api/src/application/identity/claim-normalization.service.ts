import { Injectable, Logger } from "@nestjs/common";
import type {
  ClaimNormalizer,
  NormalizedClaims,
  RawTokenClaims,
} from "../../domain/identity/claim-normalizer";
import type {
  IssuerType,
  ClaimMappingProfile,
} from "../../domain/identity/issuer-types";
import { CLAIM_PROFILES } from "../../domain/identity/issuer-types";
import { Auth0ClaimNormalizer } from "../../infrastructure/identity/auth0-claim-normalizer";

/**
 * Claim normalization service.
 *
 * Selects the appropriate ClaimNormalizer by issuer type and converts
 * raw JWT claims into the provider-agnostic ActBound internal model.
 *
 * New issuer types (Keycloak, Okta) add a normalizer here.
 */
@Injectable()
export class ClaimNormalizationService {
  private readonly logger = new Logger(ClaimNormalizationService.name);
  private readonly normalizers: Map<IssuerType, ClaimNormalizer>;

  constructor() {
    // Register normalizers by issuer type.
    // Auth0 is the only implementation for Phase 7.
    // Keycloak will be added in Phase 13.
    const auth0 = new Auth0ClaimNormalizer();
    this.normalizers = new Map<IssuerType, ClaimNormalizer>([
      ["auth0", auth0],
      // Auth0 normalizer also handles generic OIDC with actbound.ai namespace claims
      ["oidc", auth0],
    ]);
  }

  /**
   * Normalize raw JWT claims from any trusted issuer.
   * Throws if no normalizer is registered for the issuer type.
   */
  normalize(
    issuerType: IssuerType,
    issuer: string,
    claimMappingProfileId: string,
    payload: Record<string, unknown>,
  ): NormalizedClaims {
    const normalizer = this.normalizers.get(issuerType);
    if (!normalizer) {
      throw new Error(
        `No claim normalizer registered for issuer type: ${issuerType}`,
      );
    }

    const profile = this.resolveProfile(claimMappingProfileId, issuerType);

    const input: RawTokenClaims = {
      payload,
      issuer,
      issuerType,
      profile,
    };

    const normalized = normalizer.normalize(input);

    this.logger.debug(
      `Normalized claims for ${issuerType} issuer ${issuer}: ` +
        `sub=${normalized.externalSub}, type=${normalized.principalType}, tenant=${normalized.tenantId}`,
    );

    return normalized;
  }

  /** Check if a normalizer is registered for this issuer type. */
  hasNormalizer(issuerType: IssuerType): boolean {
    return this.normalizers.has(issuerType);
  }

  private resolveProfile(
    profileId: string,
    issuerType: IssuerType,
  ): ClaimMappingProfile {
    const profile = CLAIM_PROFILES[profileId];
    if (profile) return profile;

    // Fallback: use the default profile for the issuer type
    const defaultId = `${issuerType}-default`;
    const defaultProfile = CLAIM_PROFILES[defaultId];
    if (defaultProfile) {
      this.logger.warn(
        `Claim profile "${profileId}" not found, falling back to "${defaultId}"`,
      );
      return defaultProfile;
    }

    throw new Error(
      `No claim mapping profile found for "${profileId}" or default "${defaultId}"`,
    );
  }
}
