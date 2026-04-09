/**
 * Normalized principal — domain type.
 *
 * Extends the base Principal with multi-issuer identity metadata.
 * After claim normalization + identity binding, this is what the
 * authorization layer, audit, and OpenFGA consume.
 *
 * Authorization is provider-agnostic: it never sees Auth0 vs Keycloak.
 * It only sees the normalized principal with an internalSubjectId.
 */

import type { PrincipalType } from "./principal.js";
import type { IssuerType } from "./issuer-types.js";

export interface IdentitySource {
  /** Identity provider type (auth0, keycloak, okta, oidc). */
  provider: IssuerType;
  /** Human-readable label (e.g., "Acme SSO", "Auth0 Dev Tenant"). */
  issuerLabel: string;
  /** Issuer URL from the JWT `iss` claim. */
  issuerUrl: string;
}

export interface NormalizedPrincipal {
  /** Internal subject ID (UUID). Used in OpenFGA, audit, and all authorization. */
  internalSubjectId: string;
  /** External subject from the JWT `sub` claim (e.g., "auth0|abc123"). */
  externalSub: string;
  /** Issuer URL from the JWT `iss` claim. */
  issuer: string;
  /** Identity provider type. */
  issuerType: IssuerType;
  /** Normalized principal type. */
  principalType: PrincipalType;
  /** Tenant/org boundary. */
  tenantId: string;
  /** Roles from normalized claims. */
  roles: string[];
  /** Auth0 `azp` / `client_id`. */
  clientId?: string;
  /** For agents: the internal subject ID of the user being acted for. */
  onBehalfOf?: string;
  /** Agent type classification. */
  agentType?: string;
  /** Agent instance identifier. */
  agentInstanceId?: string;
  /** Service name for M2M tokens. */
  serviceName?: string;
  /** Identity source metadata for UI display. */
  identitySource: IdentitySource;
  /** Always true — demo mode is removed in Phase 7. */
  authenticated: true;
}
