/**
 * Sync queue — Redis-backed with in-memory fallback.
 *
 * Simple queue for sync event processing.
 * Supports: enqueue, dequeue, dead-letter routing.
 */

import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import {
  type SyncEvent,
  type SyncEventType,
  MAX_RETRIES,
  isRetryable,
  shouldDeadLetter,
} from "../../domain/sync-event";

@Injectable()
export class SyncQueue implements OnModuleInit {
  private readonly logger = new Logger(SyncQueue.name);
  private readonly pending: SyncEvent[] = [];
  private readonly deadLetter: SyncEvent[] = [];
  private readonly completed: SyncEvent[] = [];

  async onModuleInit() {
    this.logger.log("SyncQueue initialized (in-memory mode)");
    // TODO: Connect to Redis for production queue
  }

  async enqueue(
    eventType: SyncEventType,
    payload: Record<string, unknown>,
    tenantId = "default",
    correlationId?: string,
  ): Promise<SyncEvent> {
    const event: SyncEvent = {
      id: `sync_${randomUUID().slice(0, 8)}`,
      eventType,
      status: "pending",
      payload,
      tenantId,
      correlationId: correlationId ?? randomUUID(),
      retryCount: 0,
      maxRetries: MAX_RETRIES,
      createdAt: new Date().toISOString(),
    };

    this.pending.push(event);
    this.logger.log(`Enqueued: ${event.id} (${event.eventType})`);
    return event;
  }

  async dequeue(): Promise<SyncEvent | null> {
    const event = this.pending.shift() ?? null;
    if (event) {
      event.status = "processing";
    }
    return event;
  }

  async markCompleted(event: SyncEvent): Promise<void> {
    event.status = "completed";
    event.processedAt = new Date().toISOString();
    this.completed.push(event);
  }

  async markFailed(event: SyncEvent, error: string): Promise<void> {
    event.status = "failed";
    event.error = error;
    event.retryCount++;

    if (isRetryable(event)) {
      event.status = "pending";
      this.pending.push(event);
      this.logger.warn(
        `Retrying: ${event.id} (attempt ${event.retryCount}/${event.maxRetries})`,
      );
    } else if (shouldDeadLetter(event)) {
      event.status = "dead_letter";
      this.deadLetter.push(event);
      this.logger.error(
        `Dead-lettered: ${event.id} after ${event.retryCount} attempts: ${error}`,
      );
    }
  }

  getPendingCount(): number {
    return this.pending.length;
  }

  getDeadLetterCount(): number {
    return this.deadLetter.length;
  }

  getCompletedCount(): number {
    return this.completed.length;
  }

  getDeadLetterEvents(): SyncEvent[] {
    return [...this.deadLetter];
  }
}
