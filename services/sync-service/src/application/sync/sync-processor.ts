/**
 * Sync Processor — the worker loop.
 *
 * Polls the queue, dispatches events to projection handlers,
 * manages retries/DLQ, and emits audit + observability signals.
 */

import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { SyncQueue } from "../../infrastructure/queue/sync-queue";
import type { SyncEvent } from "../../domain/sync-event";

export interface SyncProjectionResult {
  success: boolean;
  error?: string;
  projectedTo?: string[];
}

export type ProjectionHandler = (
  event: SyncEvent,
) => Promise<SyncProjectionResult>;

@Injectable()
export class SyncProcessor implements OnModuleInit {
  private readonly logger = new Logger(SyncProcessor.name);
  private readonly handlers = new Map<string, ProjectionHandler>();
  private running = false;
  private processedCount = 0;
  private failedCount = 0;

  constructor(private readonly queue: SyncQueue) {}

  async onModuleInit() {
    this.registerDefaultHandlers();
    this.startWorkerLoop();
  }

  registerHandler(eventType: string, handler: ProjectionHandler): void {
    this.handlers.set(eventType, handler);
  }

  getStats() {
    return {
      running: this.running,
      processed: this.processedCount,
      failed: this.failedCount,
      pendingQueue: this.queue.getPendingCount(),
      deadLetter: this.queue.getDeadLetterCount(),
      completed: this.queue.getCompletedCount(),
    };
  }

  // ── Worker Loop ─────────────────────────────────────────

  private startWorkerLoop(): void {
    this.running = true;
    this.logger.log("Worker loop started");

    const poll = async () => {
      if (!this.running) return;

      const event = await this.queue.dequeue();
      if (event) {
        await this.processEvent(event);
      }

      // Poll every 1 second
      setTimeout(poll, 1000);
    };

    void poll();
  }

  private async processEvent(event: SyncEvent): Promise<void> {
    const handler = this.handlers.get(event.eventType);

    if (!handler) {
      this.logger.warn(`No handler for event type: ${event.eventType}`);
      await this.queue.markFailed(
        event,
        `No handler registered for ${event.eventType}`,
      );
      this.failedCount++;
      return;
    }

    this.logger.log(
      JSON.stringify({
        signal: "sync.processing",
        eventId: event.id,
        eventType: event.eventType,
        correlationId: event.correlationId,
        attempt: event.retryCount + 1,
      }),
    );

    try {
      const result = await handler(event);

      if (result.success) {
        await this.queue.markCompleted(event);
        this.processedCount++;

        this.logger.log(
          JSON.stringify({
            signal: "sync.completed",
            eventId: event.id,
            eventType: event.eventType,
            projectedTo: result.projectedTo,
          }),
        );
      } else {
        await this.queue.markFailed(event, result.error ?? "Projection failed");
        this.failedCount++;
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      await this.queue.markFailed(event, error);
      this.failedCount++;

      this.logger.error(
        JSON.stringify({
          signal: "sync.error",
          eventId: event.id,
          eventType: event.eventType,
          error,
          retryCount: event.retryCount,
        }),
      );
    }
  }

  // ── Default Handlers ────────────────────────────────────

  private registerDefaultHandlers(): void {
    this.registerHandler("org.membership.changed", async (event) => {
      // TODO: Project to OpenFGA + app DB
      this.logger.log(
        `Projecting org membership: ${JSON.stringify(event.payload)}`,
      );
      return { success: true, projectedTo: ["openfga", "app-db"] };
    });

    this.registerHandler("user.projected", async (event) => {
      // TODO: Upsert user projection in app DB
      this.logger.log(`Projecting user: ${JSON.stringify(event.payload)}`);
      return { success: true, projectedTo: ["app-db"] };
    });

    this.registerHandler("invitation.accepted", async (event) => {
      // TODO: Create OpenFGA tuple + update invitation status
      this.logger.log(
        `Processing invitation acceptance: ${JSON.stringify(event.payload)}`,
      );
      return { success: true, projectedTo: ["openfga", "app-db"] };
    });

    this.registerHandler("access.revoked", async (event) => {
      // TODO: Delete OpenFGA tuple + create revocation record
      this.logger.log(
        `Processing access revocation: ${JSON.stringify(event.payload)}`,
      );
      return { success: true, projectedTo: ["openfga", "app-db"] };
    });

    this.registerHandler("assistant.delegation.changed", async (event) => {
      // TODO: Update OpenFGA delegation tuples
      this.logger.log(
        `Processing delegation change: ${JSON.stringify(event.payload)}`,
      );
      return { success: true, projectedTo: ["openfga"] };
    });

    this.registerHandler("reconciliation.requested", async (event) => {
      // TODO: Compare expected state vs OpenFGA active tuples
      this.logger.log(
        `Reconciliation requested: ${JSON.stringify(event.payload)}`,
      );
      return { success: true, projectedTo: ["reconciliation-report"] };
    });
  }

  stop(): void {
    this.running = false;
    this.logger.log("Worker loop stopped");
  }
}
