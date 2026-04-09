import { Injectable, Logger } from "@nestjs/common";
import { eq, and } from "drizzle-orm";
import { getDb } from "./connection";
import { trustedIssuers } from "./schema";
import type {
  TrustedIssuer,
  IssuerType,
} from "../../domain/identity/issuer-types";
import type { TrustedIssuerRepository } from "../../domain/identity/trusted-issuer-repository";

@Injectable()
export class PostgresTrustedIssuerRepository implements TrustedIssuerRepository {
  private readonly logger = new Logger(PostgresTrustedIssuerRepository.name);

  async findByIssuerUrl(
    tenantId: string,
    issuerUrl: string,
  ): Promise<TrustedIssuer | null> {
    const db = getDb();
    if (!db) return null;
    const [row] = await db
      .select()
      .from(trustedIssuers)
      .where(
        and(
          eq(trustedIssuers.tenantId, tenantId),
          eq(trustedIssuers.issuerUrl, issuerUrl),
          eq(trustedIssuers.enabled, true),
        ),
      )
      .limit(1);
    return row ? this.toIssuer(row) : null;
  }

  async findByIssuerUrlGlobal(
    issuerUrl: string,
  ): Promise<TrustedIssuer | null> {
    const db = getDb();
    if (!db) return null;
    const [row] = await db
      .select()
      .from(trustedIssuers)
      .where(
        and(
          eq(trustedIssuers.issuerUrl, issuerUrl),
          eq(trustedIssuers.enabled, true),
        ),
      )
      .limit(1);
    return row ? this.toIssuer(row) : null;
  }

  async findByTenant(tenantId: string): Promise<TrustedIssuer[]> {
    const db = getDb();
    if (!db) return [];
    const rows = await db
      .select()
      .from(trustedIssuers)
      .where(
        and(
          eq(trustedIssuers.tenantId, tenantId),
          eq(trustedIssuers.enabled, true),
        ),
      );
    return rows.map((r) => this.toIssuer(r));
  }

  async upsert(issuer: Omit<TrustedIssuer, "id">): Promise<TrustedIssuer> {
    const db = getDb();
    if (!db) {
      throw new Error(
        "Database unavailable — cannot upsert trusted issuer (fail-closed)",
      );
    }

    const [row] = await db
      .insert(trustedIssuers)
      .values({
        tenantId: issuer.tenantId,
        issuerType: issuer.issuerType,
        issuerUrl: issuer.issuerUrl,
        displayName: issuer.displayName,
        audience: issuer.audience,
        jwksUrl: issuer.jwksUrl,
        discoveryUrl: issuer.discoveryUrl,
        claimMappingProfile: issuer.claimMappingProfile,
        enabled: issuer.enabled,
        metadata: issuer.metadata,
      })
      .onConflictDoUpdate({
        target: [trustedIssuers.tenantId, trustedIssuers.issuerUrl],
        set: {
          displayName: issuer.displayName,
          audience: issuer.audience,
          jwksUrl: issuer.jwksUrl,
          discoveryUrl: issuer.discoveryUrl,
          claimMappingProfile: issuer.claimMappingProfile,
          enabled: issuer.enabled,
          metadata: issuer.metadata,
          updatedAt: new Date(),
        },
      })
      .returning();

    this.logger.log(
      `Trusted issuer upserted: ${issuer.issuerType} at ${issuer.issuerUrl} for tenant ${issuer.tenantId}`,
    );

    return this.toIssuer(row!);
  }

  private toIssuer(row: typeof trustedIssuers.$inferSelect): TrustedIssuer {
    return {
      id: row.id,
      tenantId: row.tenantId,
      issuerType: row.issuerType as IssuerType,
      issuerUrl: row.issuerUrl,
      displayName: row.displayName,
      audience: row.audience ?? undefined,
      jwksUrl: row.jwksUrl ?? undefined,
      discoveryUrl: row.discoveryUrl ?? undefined,
      claimMappingProfile: row.claimMappingProfile,
      enabled: row.enabled,
      metadata: (row.metadata ?? {}) as Record<string, unknown>,
    };
  }
}
