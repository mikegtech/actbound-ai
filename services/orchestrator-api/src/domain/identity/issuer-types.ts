/**
 * Trusted issuer registry — domain types.
 *
 * Defines the multi-issuer OIDC architecture.
 * Auth0 is Tier 1 (first provider). Keycloak is Tier 1 (next).
 * Okta and generic OIDC are Tier 2.
 *
 * No infrastructure or framework imports.
 */

export type IssuerType = "auth0" | "keycloak" | "okta" | "oidc";

export interface TrustedIssuer {
  id: string;
  tenantId: string;
  issuerType: IssuerType;
  issuerUrl: string;
  displayName: string;
  audience?: string;
  jwksUrl?: string;
  discoveryUrl?: string;
  claimMappingProfile: string;
  enabled: boolean;
  metadata: Record<string, unknown>;
}

/**
 * Claim mapping profile — defines how an issuer's JWT claims
 * map to the normalized ActBound principal model.
 *
 * Each issuer type has different claim locations:
 * - Auth0: `https://actbound.ai/principal_type`
 * - Keycloak: `realm_access.roles`, custom mappers
 * - Okta: `groups`, custom claims
 */
export interface ClaimMappingProfile {
  id: string;
  issuerType: IssuerType;
  /** Claim path for principal type (e.g., "https://actbound.ai/principal_type") */
  principalTypeClaim: string;
  /** Claim path for roles (e.g., "https://actbound.ai/roles") */
  rolesClaim: string;
  /** Claim path for tenant ID (e.g., "https://actbound.ai/tenant_id") */
  tenantIdClaim: string;
  /** Claim path for on_behalf_of delegation */
  onBehalfOfClaim?: string;
  /** Claim path for agent instance ID */
  agentInstanceIdClaim?: string;
  /** Claim path for agent type */
  agentTypeClaim?: string;
  /** Claim path for service name */
  serviceNameClaim?: string;
}

/**
 * Default Auth0 claim mapping profile.
 * Uses the `https://actbound.ai/` namespace per ADR-006.
 */
export const AUTH0_CLAIM_PROFILE: ClaimMappingProfile = {
  id: "auth0-default",
  issuerType: "auth0",
  principalTypeClaim: "https://actbound.ai/principal_type",
  rolesClaim: "https://actbound.ai/roles",
  tenantIdClaim: "https://actbound.ai/tenant_id",
  onBehalfOfClaim: "https://actbound.ai/on_behalf_of",
  agentInstanceIdClaim: "https://actbound.ai/agent_instance_id",
  agentTypeClaim: "https://actbound.ai/agent_type",
  serviceNameClaim: "https://actbound.ai/service_name",
};

/**
 * Keycloak claim mapping profile (placeholder for Phase 13).
 * Keycloak uses `realm_access.roles` and custom protocol mappers.
 */
export const KEYCLOAK_CLAIM_PROFILE: ClaimMappingProfile = {
  id: "keycloak-default",
  issuerType: "keycloak",
  principalTypeClaim: "https://actbound.ai/principal_type",
  rolesClaim: "realm_access.roles",
  tenantIdClaim: "https://actbound.ai/tenant_id",
  onBehalfOfClaim: "https://actbound.ai/on_behalf_of",
  agentInstanceIdClaim: "https://actbound.ai/agent_instance_id",
  agentTypeClaim: "https://actbound.ai/agent_type",
  serviceNameClaim: "https://actbound.ai/service_name",
};

/** Known claim profiles indexed by ID. */
export const CLAIM_PROFILES: Record<string, ClaimMappingProfile> = {
  "auth0-default": AUTH0_CLAIM_PROFILE,
  "keycloak-default": KEYCLOAK_CLAIM_PROFILE,
};
