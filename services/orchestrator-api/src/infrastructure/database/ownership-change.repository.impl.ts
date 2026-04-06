import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { getDb } from "./connection";
import { ownershipChanges } from "./schema";
import type {
  OwnershipChangeRecord,
  CreateOwnershipChangeInput,
  OwnershipChangeRepository,
} from "../../domain/ownership/ownership-change.repository";

@Injectable()
export class PostgresOwnershipChangeRepository implements OwnershipChangeRepository {
  async create(
    input: CreateOwnershipChangeInput,
  ): Promise<OwnershipChangeRecord> {
    const db = getDb();
    if (!db) {
      const now = new Date().toISOString();
      return {
        ...input,
        tenantId: input.tenantId ?? "default",
        createdAt: now,
      };
    }

    const [row] = await db
      .insert(ownershipChanges)
      .values({
        id: input.id,
        tenantId: input.tenantId ?? "default",
        resourceId: input.resourceId,
        previousOwnerType: input.previousOwnerType,
        previousOwnerId: input.previousOwnerId,
        newOwnerType: input.newOwnerType,
        newOwnerId: input.newOwnerId,
        changedBy: input.changedBy,
        reason: input.reason,
      })
      .returning();

    return this.toRecord(row!);
  }

  async findByResource(resourceId: string): Promise<OwnershipChangeRecord[]> {
    const db = getDb();
    if (!db) return [];
    return (
      await db
        .select()
        .from(ownershipChanges)
        .where(eq(ownershipChanges.resourceId, resourceId))
    ).map((r) => this.toRecord(r));
  }

  private toRecord(
    row: typeof ownershipChanges.$inferSelect,
  ): OwnershipChangeRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      resourceId: row.resourceId,
      previousOwnerType: row.previousOwnerType ?? undefined,
      previousOwnerId: row.previousOwnerId ?? undefined,
      newOwnerType: row.newOwnerType,
      newOwnerId: row.newOwnerId,
      changedBy: row.changedBy ?? undefined,
      reason: row.reason ?? undefined,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
