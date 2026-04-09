import { Injectable, Logger } from "@nestjs/common";
import { eq, and } from "drizzle-orm";
import { getDb } from "./connection";
import { identityBindings } from "./schema";
import type {
  IdentityBinding,
  CreateIdentityBindingInput,
  IdentityBindingRepository,
} from "../../domain/identity/identity-binding";
import type { IssuerType } from "../../domain/identity/issuer-types";

@Injectable()
export class PostgresIdentityBindingRepository implements IdentityBindingRepository {
  private readonly logger = new Logger(PostgresIdentityBindingRepository.name);

  async findByExternalIdentity(
    issuer: string,
    externalSub: string,
  ): Promise<IdentityBinding | null> {
    const db = getDb();
    if (!db) return null;
    const [row] = await db
      .select()
      .from(identityBindings)
      .where(
        and(
          eq(identityBindings.issuer, issuer),
          eq(identityBindings.externalSub, externalSub),
        ),
      )
      .limit(1);
    return row ? this.toBinding(row) : null;
  }

  async findByInternalSubject(
    internalSubjectId: string,
  ): Promise<IdentityBinding | null> {
    const db = getDb();
    if (!db) return null;
    const [row] = await db
      .select()
      .from(identityBindings)
      .where(eq(identityBindings.internalSubjectId, internalSubjectId))
      .limit(1);
    return row ? this.toBinding(row) : null;
  }

  async findByTenant(tenantId: string): Promise<IdentityBinding[]> {
    const db = getDb();
    if (!db) return [];
    const rows = await db
      .select()
      .from(identityBindings)
      .where(eq(identityBindings.tenantId, tenantId));
    return rows.map((r) => this.toBinding(r));
  }

  async create(input: CreateIdentityBindingInput): Promise<IdentityBinding> {
    const db = getDb();
    if (!db) {
      throw new Error(
        "Database unavailable — cannot create identity binding (fail-closed)",
      );
    }

    const [row] = await db
      .insert(identityBindings)
      .values({
        issuer: input.issuer,
        externalSub: input.externalSub,
        issuerType: input.issuerType,
        tenantId: input.tenantId,
        displayName: input.displayName,
        email: input.email,
        lastLoginAt: new Date(),
      })
      .returning();

    this.logger.log(
      `Identity binding created: ${input.issuer}|${input.externalSub} → ${row!.internalSubjectId}`,
    );

    return this.toBinding(row!);
  }

  async touchLastLogin(id: string): Promise<void> {
    const db = getDb();
    if (!db) return;
    await db
      .update(identityBindings)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(identityBindings.id, id));
  }

  private toBinding(
    row: typeof identityBindings.$inferSelect,
  ): IdentityBinding {
    return {
      id: row.id,
      issuer: row.issuer,
      externalSub: row.externalSub,
      internalSubjectId: row.internalSubjectId,
      issuerType: row.issuerType as IssuerType,
      tenantId: row.tenantId,
      displayName: row.displayName ?? undefined,
      email: row.email ?? undefined,
      status: row.status as "active" | "suspended" | "deleted",
      lastLoginAt: row.lastLoginAt ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
