/**
 * Claim normalizer — domain interface.
 *
 * Converts raw JWT claims from any trusted issuer into a normalized
 * set of ActBound-internal claims. The normalization pipeline uses
 * a ClaimMappingProfile to locate claim values.
 *
 * Each issuer type may have a different implementation:
 * - Auth0: claims in `https://actbound.ai/` namespace
 * - Keycloak: roles in `realm_access.roles`
 * - Okta: roles in `groups`
 *
 * No infrastructure imports.
 */

import type { PrincipalType } from "./principal.js";
import type { IssuerType } from "./issuer-types.js";
import type { ClaimMappingProfile } from "./issuer-types.js";

/** The output of claim normalization — issuer-agnostic. */
export interface NormalizedClaims {
  externalSub: string;
  issuer: string;
  issuerType: IssuerType;
  principalType: PrincipalType;
  tenantId: string;
  roles: string[];
  clientId?: string;
  onBehalfOf?: string;
  agentType?: string;
  agentInstanceId?: string;
  serviceName?: string;
}

/** Input to the claim normalizer. */
export interface RawTokenClaims {
  /** Raw JWT payload as key-value pairs. */
  payload: Record<string, unknown>;
  /** The `iss` claim from the JWT. */
  issuer: string;
  /** The resolved issuer type from the registry. */
  issuerType: IssuerType;
  /** The claim mapping profile for this issuer. */
  profile: ClaimMappingProfile;
}

/**
 * Claim normalizer interface.
 * Implementations are selected by issuer type.
 */
export interface ClaimNormalizer {
  /** Which issuer type this normalizer handles. */
  readonly issuerType: IssuerType;

  /** Normalize raw JWT claims into the ActBound internal model. */
  normalize(input: RawTokenClaims): NormalizedClaims;
}
