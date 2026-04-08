/**
 * Sync Controller — event ingestion endpoint.
 *
 * Accepts normalized sync events and enqueues them for processing.
 * In production, Auth0 webhooks would POST here.
 */

import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { SyncQueue } from "../infrastructure/queue/sync-queue";
import type { SyncEventType } from "../domain/sync-event";

interface EnqueueBody {
  eventType: SyncEventType;
  payload: Record<string, unknown>;
  tenantId?: string;
  correlationId?: string;
}

@Controller("sync")
export class SyncController {
  constructor(private readonly queue: SyncQueue) {}

  @Post("events")
  @HttpCode(202)
  async enqueue(@Body() body: EnqueueBody) {
    const event = await this.queue.enqueue(
      body.eventType,
      body.payload,
      body.tenantId,
      body.correlationId,
    );

    return {
      accepted: true,
      eventId: event.id,
      eventType: event.eventType,
      status: event.status,
    };
  }
}
