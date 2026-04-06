/**
 * NestJS audit writer — bridges DurableAuditService to the shared AuditWriter interface.
 *
 * This adapter lets the framework-agnostic executeAuditedOperation work
 * with the existing NestJS DI-backed persistence layer.
 */

import { Injectable } from "@nestjs/common";
import type { AuditWriter, AuditEventInput } from "@actbound/sdk";
import { DurableAuditService } from "./durable-audit.service";

@Injectable()
export class NestAuditWriter implements AuditWriter {
  constructor(private readonly durableAudit: DurableAuditService) {}

  async record(
    requestId: string,
    tenantId: string,
    sourceService: string,
    event: AuditEventInput,
  ): Promise<void> {
    await this.durableAudit.record({
      tenantId,
      eventType: event.eventType,
      requestId,
      actor: event.actor,
      subject: event.subject,
      resource: event.resource,
      action: event.action,
      decision: event.decision,
      metadata: {
        ...event.metadata,
        sourceService,
      },
    });
  }
}
