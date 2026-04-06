/**
 * Assistant repository — Postgres/Drizzle implementation.
 * Infrastructure layer only.
 */

import { Injectable, Logger } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { getDb } from "./connection";
import { assistants } from "./schema";
import type {
  AssistantRecord,
  CreateAssistantInput,
  AssistantRepository,
} from "../../domain/assistants/assistant.repository";

@Injectable()
export class PostgresAssistantRepository implements AssistantRepository {
  private readonly logger = new Logger(PostgresAssistantRepository.name);

  async create(input: CreateAssistantInput): Promise<AssistantRecord> {
    const db = getDb();
    if (!db) {
      this.logger.warn("DATABASE_URL not set — assistant not persisted");
      return this.toFallback(input);
    }

    const [row] = await db
      .insert(assistants)
      .values({
        id: input.id,
        tenantId: input.tenantId ?? "default",
        organizationId: input.organizationId,
        name: input.name,
        assistantType: input.assistantType ?? "general",
        runtimeMode: input.runtimeMode ?? "managed",
        description: input.description,
        createdBy: input.createdBy,
      })
      .returning();

    return this.toRecord(row!);
  }

  async findById(id: string): Promise<AssistantRecord | null> {
    const db = getDb();
    if (!db) return null;

    const [row] = await db
      .select()
      .from(assistants)
      .where(eq(assistants.id, id))
      .limit(1);

    return row ? this.toRecord(row) : null;
  }

  async findByOrg(orgId: string): Promise<AssistantRecord[]> {
    const db = getDb();
    if (!db) return [];

    const rows = await db
      .select()
      .from(assistants)
      .where(eq(assistants.organizationId, orgId));

    return rows.map((r) => this.toRecord(r));
  }

  async updateStatus(
    id: string,
    status: string,
    updatedBy?: string,
  ): Promise<AssistantRecord | null> {
    const db = getDb();
    if (!db) return null;

    const [row] = await db
      .update(assistants)
      .set({ status, updatedBy, updatedAt: new Date() })
      .where(eq(assistants.id, id))
      .returning();

    return row ? this.toRecord(row) : null;
  }

  private toRecord(row: typeof assistants.$inferSelect): AssistantRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      organizationId: row.organizationId ?? undefined,
      name: row.name,
      assistantType: row.assistantType,
      runtimeMode: row.runtimeMode,
      status: row.status,
      description: row.description ?? undefined,
      createdBy: row.createdBy ?? undefined,
      updatedBy: row.updatedBy ?? undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toFallback(input: CreateAssistantInput): AssistantRecord {
    const now = new Date().toISOString();
    return {
      id: input.id,
      tenantId: input.tenantId ?? "default",
      organizationId: input.organizationId,
      name: input.name,
      assistantType: input.assistantType ?? "general",
      runtimeMode: input.runtimeMode ?? "managed",
      status: "active",
      description: input.description,
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    };
  }
}
