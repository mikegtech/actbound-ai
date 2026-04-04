/**
 * Tuple sync service — processes lifecycle events and projects them
 * into OpenFGA tuple mutations.
 *
 * Responsibilities:
 * 1. Accept normalized lifecycle events
 * 2. Map them to tuple operations via the mapper
 * 3. Execute writes/deletes against OpenFGA (idempotent)
 * 4. Emit structured audit logs for every operation
 */

import type { OpenFgaClient } from "@openfga/sdk";
import { mapEventToTuples, type TupleOperation } from "./mapper";
import type { SyncEvent } from "./events";

export interface SyncLogger {
  info(message: string, fields: Record<string, unknown>): void;
  warn(message: string, fields: Record<string, unknown>): void;
  error(message: string, fields: Record<string, unknown>): void;
}

export interface SyncResult {
  eventId: string;
  eventType: string;
  operations: Array<{
    action: "write" | "delete";
    user: string;
    relation: string;
    object: string;
    result: "ok" | "skipped" | "error";
    error?: string;
  }>;
  success: boolean;
}

const defaultLogger: SyncLogger = {
  info: (msg, fields) =>
    console.log(JSON.stringify({ level: "info", message: msg, ...fields })),
  warn: (msg, fields) =>
    console.warn(JSON.stringify({ level: "warn", message: msg, ...fields })),
  error: (msg, fields) =>
    console.error(JSON.stringify({ level: "error", message: msg, ...fields })),
};

export class TupleSyncService {
  constructor(
    private readonly client: OpenFgaClient,
    private readonly logger: SyncLogger = defaultLogger,
    private readonly authorizationModelId?: string,
  ) {}

  async processEvent(event: SyncEvent): Promise<SyncResult> {
    const operations = mapEventToTuples(event);
    const results: SyncResult["operations"] = [];

    for (const op of operations) {
      const logFields = {
        event_id: event.eventId,
        event_type: event.eventType,
        subject_type: event.subjectType,
        subject_id: event.subjectId,
        relation: op.relation,
        object_type: event.objectType,
        object_id: event.objectId,
        operation: op.action,
        correlation_id: event.correlationId,
      };

      try {
        await this.executeTupleOperation(op);
        results.push({ ...op, result: "ok" });
        this.logger.info("tuple_sync_ok", { ...logFields, result: "ok" });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);

        // OpenFGA returns specific errors for already-exists (write) and not-found (delete).
        // Both are idempotent — treat as success.
        if (this.isIdempotentError(errorMessage, op.action)) {
          results.push({ ...op, result: "skipped" });
          this.logger.info("tuple_sync_idempotent_skip", {
            ...logFields,
            result: "skipped",
          });
        } else {
          results.push({ ...op, result: "error", error: errorMessage });
          this.logger.error("tuple_sync_error", {
            ...logFields,
            result: "error",
            error: errorMessage,
          });
        }
      }
    }

    const success = results.every((r) => r.result !== "error");

    return {
      eventId: event.eventId,
      eventType: event.eventType,
      operations: results,
      success,
    };
  }

  async processBatch(events: SyncEvent[]): Promise<SyncResult[]> {
    const results: SyncResult[] = [];
    for (const event of events) {
      results.push(await this.processEvent(event));
    }
    return results;
  }

  private async executeTupleOperation(op: TupleOperation): Promise<void> {
    const tuple = {
      user: op.user,
      relation: op.relation,
      object: op.object,
    };

    const options = this.authorizationModelId
      ? { authorizationModelId: this.authorizationModelId }
      : {};

    if (op.action === "write") {
      await this.client.write({ writes: [tuple] }, options);
    } else {
      await this.client.write({ deletes: [tuple] }, options);
    }
  }

  private isIdempotentError(message: string, action: string): boolean {
    if (action === "write" && message.includes("already exists")) return true;
    if (action === "delete" && message.includes("not found")) return true;
    // OpenFGA SDK may throw different error formats
    if (message.includes("cannot write a tuple which already exists"))
      return true;
    if (message.includes("cannot delete a tuple which does not exist"))
      return true;
    return false;
  }
}
