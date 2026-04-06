/**
 * Resource repository — Postgres/Drizzle implementation.
 * Infrastructure layer only.
 */

import { Injectable, Logger } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { getDb } from "./connection";
import { resources } from "./schema";
import type {
  ResourceRecord,
  CreateResourceInput,
  ResourceRepository,
} from "../../domain/resources/resource.repository";

@Injectable()
export class PostgresResourceRepository implements ResourceRepository {
  private readonly logger = new Logger(PostgresResourceRepository.name);

  async create(input: CreateResourceInput): Promise<ResourceRecord> {
    const db = getDb();
    if (!db) {
      this.logger.warn("DATABASE_URL not set — resource not persisted");
      return this.toFallback(input);
    }

    const [row] = await db
      .insert(resources)
      .values({
        id: input.id,
        tenantId: input.tenantId ?? "default",
        organizationId: input.organizationId,
        resourceType: input.resourceType ?? "document",
        displayName: input.displayName,
        ownerType: input.ownerType,
        ownerId: input.ownerId,
        metadata: input.metadata ?? {},
      })
      .returning();

    return this.toRecord(row!);
  }

  async findById(id: string): Promise<ResourceRecord | null> {
    const db = getDb();
    if (!db) return null;

    const [row] = await db
      .select()
      .from(resources)
      .where(eq(resources.id, id))
      .limit(1);

    return row ? this.toRecord(row) : null;
  }

  async findByOrg(orgId: string): Promise<ResourceRecord[]> {
    const db = getDb();
    if (!db) return [];

    return (
      await db
        .select()
        .from(resources)
        .where(eq(resources.organizationId, orgId))
    ).map((r) => this.toRecord(r));
  }

  async findByOwner(
    ownerType: string,
    ownerId: string,
  ): Promise<ResourceRecord[]> {
    const db = getDb();
    if (!db) return [];

    return (
      await db.select().from(resources).where(eq(resources.ownerId, ownerId))
    )
      .filter((r) => r.ownerType === ownerType)
      .map((r) => this.toRecord(r));
  }

  private toRecord(row: typeof resources.$inferSelect): ResourceRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      organizationId: row.organizationId ?? undefined,
      resourceType: row.resourceType,
      displayName: row.displayName,
      status: row.status,
      ownerType: row.ownerType ?? undefined,
      ownerId: row.ownerId ?? undefined,
      metadata: (row.metadata as Record<string, unknown>) ?? {},
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toFallback(input: CreateResourceInput): ResourceRecord {
    const now = new Date().toISOString();
    return {
      id: input.id,
      tenantId: input.tenantId ?? "default",
      organizationId: input.organizationId,
      resourceType: input.resourceType ?? "document",
      displayName: input.displayName,
      status: "active",
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      metadata: input.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    };
  }
}
