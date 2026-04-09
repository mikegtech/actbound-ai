/**
 * Trusted issuer repository — domain interface.
 *
 * Resolves which OIDC issuers are trusted for a given tenant.
 * Infrastructure layer implements this with Postgres + optional config seed.
 *
 * No infrastructure imports.
 */

import type { TrustedIssuer } from "./issuer-types.js";

export interface TrustedIssuerRepository {
  /** Find a trusted issuer by URL for a given tenant. Returns null if not trusted. */
  findByIssuerUrl(
    tenantId: string,
    issuerUrl: string,
  ): Promise<TrustedIssuer | null>;

  /** Find a trusted issuer by URL across all tenants. For JWT pre-validation. */
  findByIssuerUrlGlobal(issuerUrl: string): Promise<TrustedIssuer | null>;

  /** List all enabled issuers for a tenant. */
  findByTenant(tenantId: string): Promise<TrustedIssuer[]>;

  /** Create or update a trusted issuer entry. */
  upsert(issuer: Omit<TrustedIssuer, "id">): Promise<TrustedIssuer>;
}
