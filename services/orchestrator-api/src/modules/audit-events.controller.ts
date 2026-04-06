/**
 * Audit Events Controller
 *
 * Reads from durable storage (Postgres) with fallback to in-memory store.
 * Supports filtering by event type, actor, resource, request/workflow IDs.
 */

import { evaluateAuditViewing } from "@actbound/authorization";
import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Query,
  Req,
} from "@nestjs/common";

import type { RequestWithAuthContext } from "../common/request-context";
import { DurableAuditService } from "../application/audit/durable-audit.service";
import { AuditEventStore } from "../domain/audit/audit-event.store";

@Controller("audit-events")
export class AuditEventsController {
  constructor(
    private readonly durableAudit: DurableAuditService,
    private readonly inMemoryStore: AuditEventStore,
  ) {}

  @Get()
  async getAuditEvents(
    @Req() request: RequestWithAuthContext,
    @Query("eventType") eventType?: string,
    @Query("actorSub") actorSub?: string,
    @Query("resourceType") resourceType?: string,
    @Query("resourceId") resourceId?: string,
    @Query("requestId") requestId?: string,
    @Query("workflowId") workflowId?: string,
    @Query("limit") limitStr?: string,
    @Query("offset") offsetStr?: string,
  ) {
    const authContext = request.authContext;

    if (!authContext) {
      throw new ForbiddenException({
        code: "auth_context_missing",
        message: "Authorization context was not attached to the request.",
      });
    }

    const decision = evaluateAuditViewing(authContext, {
      type: "audit_event",
      ownerSubjectId: authContext.subject.id,
    });

    if (!decision.allowed) {
      throw new ForbiddenException({
        code: "permission_denied",
        message: "Audit events are not available for the current context.",
        details: {
          permission: decision.permission,
          reasons: decision.reasons,
        },
      });
    }

    const limit = limitStr ? parseInt(limitStr, 10) : 50;
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;

    // Try durable storage first
    const durableEvents = await this.durableAudit.find({
      eventType,
      actorSub,
      resourceType,
      resourceId,
      requestId,
      workflowId,
      limit,
      offset,
    });

    if (durableEvents.length > 0) {
      return { events: durableEvents, source: "durable" };
    }

    // Fall back to in-memory store (backward compat for demo)
    this.inMemoryStore.seedDemoEvents(authContext.actor.id);
    return {
      events: this.inMemoryStore.listAll(limit),
      source: "in-memory",
    };
  }

  @Get(":id")
  async getAuditEvent(
    @Req() request: RequestWithAuthContext,
    @Param("id") id: string,
  ) {
    const authContext = request.authContext;

    if (!authContext) {
      throw new ForbiddenException({
        code: "auth_context_missing",
        message: "Authorization context was not attached to the request.",
      });
    }

    const event = await this.durableAudit.findById(id);
    if (!event) {
      return { error: "Event not found" };
    }
    return event;
  }
}
