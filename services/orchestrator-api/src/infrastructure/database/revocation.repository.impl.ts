import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { getDb } from "./connection";
import { revocations } from "./schema";
import type {
  RevocationRecord,
  CreateRevocationInput,
  RevocationRepository,
} from "../../domain/revocations/revocation.repository";

@Injectable()
export class PostgresRevocationRepository implements RevocationRepository {
  async create(input: CreateRevocationInput): Promise<RevocationRecord> {
    const db = getDb();
    if (!db) {
      const now = new Date().toISOString();
      return {
        ...input,
        tenantId: input.tenantId ?? "default",
        effectiveAt: now,
        metadata: input.metadata ?? {},
        createdAt: now,
      };
    }

    const [row] = await db
      .insert(revocations)
      .values({
        id: input.id,
        tenantId: input.tenantId ?? "default",
        organizationId: input.organizationId,
        resourceId: input.resourceId,
        subjectSub: input.subjectSub,
        assistantId: input.assistantId,
        revocationType: input.revocationType,
        reason: input.reason,
        revokedBy: input.revokedBy,
        metadata: input.metadata ?? {},
      })
      .returning();

    return this.toRecord(row!);
  }

  async findByResource(resourceId: string): Promise<RevocationRecord[]> {
    const db = getDb();
    if (!db) return [];
    return (
      await db
        .select()
        .from(revocations)
        .where(eq(revocations.resourceId, resourceId))
    ).map((r) => this.toRecord(r));
  }

  async findBySubject(subjectSub: string): Promise<RevocationRecord[]> {
    const db = getDb();
    if (!db) return [];
    return (
      await db
        .select()
        .from(revocations)
        .where(eq(revocations.subjectSub, subjectSub))
    ).map((r) => this.toRecord(r));
  }

  private toRecord(row: typeof revocations.$inferSelect): RevocationRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      organizationId: row.organizationId ?? undefined,
      resourceId: row.resourceId ?? undefined,
      subjectSub: row.subjectSub ?? undefined,
      assistantId: row.assistantId ?? undefined,
      revocationType: row.revocationType,
      reason: row.reason ?? undefined,
      revokedBy: row.revokedBy ?? undefined,
      effectiveAt: row.effectiveAt.toISOString(),
      metadata: (row.metadata as Record<string, unknown>) ?? {},
      createdAt: row.createdAt.toISOString(),
    };
  }
}
