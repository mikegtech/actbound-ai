import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import type { TrustedIssuerRepository } from "../../domain/identity/trusted-issuer-repository";

/**
 * Seeds the trusted issuer registry on application startup.
 *
 * Ensures Auth0 production tenant is registered as a trusted issuer.
 * Uses upsert so re-runs are safe (idempotent).
 *
 * Both the custom domain (auth.actbound.ai) and the raw tenant domain
 * are registered, since Auth0 may use either depending on configuration
 * and token type (user vs M2M).
 */
@Injectable()
export class IssuerSeedService implements OnModuleInit {
  private readonly logger = new Logger(IssuerSeedService.name);

  constructor(
    @Inject("TRUSTED_ISSUER_REPOSITORY")
    private readonly issuerRepository: TrustedIssuerRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    const domain = process.env.AUTH0_DOMAIN;
    if (!domain) {
      this.logger.warn("AUTH0_DOMAIN not set — skipping trusted issuer seed");
      return;
    }

    const audience = process.env.AUTH0_AUDIENCE ?? "https://api.actbound.ai";
    const tenantId = process.env.DEFAULT_TENANT_ID ?? "default";

    // Derive issuer URLs from domain.
    // Custom domain: "auth.actbound.ai" → "https://auth.actbound.ai/"
    // Raw tenant: "actbound-prod.us.auth0.com" → "https://actbound-prod.us.auth0.com/"
    const issuerUrl = `https://${domain}/`;

    try {
      await this.issuerRepository.upsert({
        tenantId,
        issuerType: "auth0",
        issuerUrl,
        displayName: "Auth0 Production",
        audience,
        jwksUrl: `https://${domain}/.well-known/jwks.json`,
        discoveryUrl: `https://${domain}/.well-known/openid-configuration`,
        claimMappingProfile: "auth0-default",
        enabled: true,
        metadata: {},
      });

      this.logger.log(
        `Trusted issuer seeded: ${issuerUrl} (tenant: ${tenantId})`,
      );

      // If the domain is a custom domain, also register the raw Auth0 tenant
      // domain since M2M tokens may use the raw tenant issuer URL.
      const rawTenant = process.env.AUTH0_RAW_TENANT;
      if (rawTenant && rawTenant !== domain) {
        const rawIssuerUrl = `https://${rawTenant}/`;
        await this.issuerRepository.upsert({
          tenantId,
          issuerType: "auth0",
          issuerUrl: rawIssuerUrl,
          displayName: "Auth0 Production (raw tenant)",
          audience,
          jwksUrl: `https://${rawTenant}/.well-known/jwks.json`,
          discoveryUrl: `https://${rawTenant}/.well-known/openid-configuration`,
          claimMappingProfile: "auth0-default",
          enabled: true,
          metadata: { isRawTenant: true },
        });

        this.logger.log(`Trusted issuer seeded (raw): ${rawIssuerUrl}`);
      }
    } catch (err) {
      this.logger.warn(
        `Failed to seed trusted issuer (database may not be ready): ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
