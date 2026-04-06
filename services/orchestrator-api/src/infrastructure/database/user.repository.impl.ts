import { Injectable, Logger } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { getDb } from "./connection";
import { users } from "./schema";
import type {
  UserRecord,
  UpsertUserInput,
  UserRepository,
} from "../../domain/users/user.repository";

@Injectable()
export class PostgresUserRepository implements UserRepository {
  private readonly logger = new Logger(PostgresUserRepository.name);

  async upsert(input: UpsertUserInput): Promise<UserRecord> {
    const db = getDb();
    if (!db) {
      const now = new Date().toISOString();
      return {
        sub: input.sub,
        tenantId: input.tenantId ?? "default",
        displayName: input.displayName,
        email: input.email,
        status: "active",
        createdAt: now,
        updatedAt: now,
      };
    }

    const [row] = await db
      .insert(users)
      .values({
        sub: input.sub,
        tenantId: input.tenantId ?? "default",
        displayName: input.displayName,
        email: input.email,
      })
      .onConflictDoUpdate({
        target: users.sub,
        set: {
          displayName: input.displayName,
          email: input.email,
          updatedAt: new Date(),
        },
      })
      .returning();

    return this.toRecord(row!);
  }

  async findBySub(sub: string): Promise<UserRecord | null> {
    const db = getDb();
    if (!db) return null;
    const [row] = await db
      .select()
      .from(users)
      .where(eq(users.sub, sub))
      .limit(1);
    return row ? this.toRecord(row) : null;
  }

  async findByTenant(tenantId: string): Promise<UserRecord[]> {
    const db = getDb();
    if (!db) return [];
    return (
      await db.select().from(users).where(eq(users.tenantId, tenantId))
    ).map((r) => this.toRecord(r));
  }

  private toRecord(row: typeof users.$inferSelect): UserRecord {
    return {
      sub: row.sub,
      tenantId: row.tenantId,
      displayName: row.displayName ?? undefined,
      email: row.email ?? undefined,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
