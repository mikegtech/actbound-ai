import { Controller, Get } from "@nestjs/common";
import { SyncProcessor } from "../application/sync/sync-processor";
import { SyncQueue } from "../infrastructure/queue/sync-queue";

@Controller()
export class HealthController {
  constructor(
    private readonly processor: SyncProcessor,
    private readonly queue: SyncQueue,
  ) {}

  @Get("health")
  getHealth() {
    const stats = this.processor.getStats();

    return {
      service: "sync-service",
      status: stats.running ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      worker: {
        running: stats.running,
        processed: stats.processed,
        failed: stats.failed,
      },
      queue: {
        pending: stats.pendingQueue,
        deadLetter: stats.deadLetter,
        completed: stats.completed,
      },
    };
  }

  @Get("dead-letter")
  getDeadLetter() {
    return {
      events: this.queue.getDeadLetterEvents(),
      count: this.queue.getDeadLetterCount(),
    };
  }
}
