/**
 * Organization repository — Postgres/Drizzle implementation.
 * Infrastructure layer only.
 */

import { Injectable, Logger } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { getDb } from "./connection";
import { organizations } from "./schema";
import type {
  OrganizationRecord,
  CreateOrganizationInput,
  OrganizationRepository,
} from "../../domain/organizations/organization.repository";

@Injectable()
export class PostgresOrganizationRepository implements OrganizationRepository {
  private readonly logger = new Logger(PostgresOrganizationRepository.name);

  async create(input: CreateOrganizationInput): Promise<OrganizationRecord> {
    const db = getDb();
    if (!db) {
      this.logger.warn("DATABASE_URL not set — org not persisted");
      const now = new Date().toISOString();
      return {
        id: input.id,
        tenantId: input.tenantId ?? "default",
        name: input.name,
        status: "active",
        createdAt: now,
        updatedAt: now,
      };
    }

    const [row] = await db
      .insert(organizations)
      .values({
        id: input.id,
        tenantId: input.tenantId ?? "default",
        name: input.name,
      })
      .returning();

    return this.toRecord(row!);
  }

  async findById(id: string): Promise<OrganizationRecord | null> {
    const db = getDb();
    if (!db) return null;

    const [row] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);

    return row ? this.toRecord(row) : null;
  }

  async findByTenant(tenantId: string): Promise<OrganizationRecord[]> {
    const db = getDb();
    if (!db) return [];

    return (
      await db
        .select()
        .from(organizations)
        .where(eq(organizations.tenantId, tenantId))
    ).map((r) => this.toRecord(r));
  }

  private toRecord(row: typeof organizations.$inferSelect): OrganizationRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      name: row.name,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
