/**
 * Drizzle ORM schema — orchestrator-api database.
 *
 * Per ADR-005: Drizzle belongs only in the infrastructure layer.
 * Domain and application layers must never import this file.
 *
 * Database layout:
 * - actbound database, audit schema: audit_events (append-only audit trail)
 * - actbound database, public schema: future app tables (orgs, users, resources)
 * - openfga database: OpenFGA tuples and models (separate database)
 */

import {
  boolean,
  index,
  jsonb,
  pgSchema,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Dedicated audit schema — append-oriented, immutable event storage
const auditSchema = pgSchema("audit");

export const auditEvents = auditSchema.table(
  "audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: text("tenant_id").notNull().default("default"),
    eventType: text("event_type").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    // Correlation
    requestId: text("request_id"),
    workflowId: text("workflow_id"),

    // Actor
    actorSub: text("actor_sub").notNull(),
    actorPrincipalType: text("actor_principal_type").notNull(),
    actorDisplayName: text("actor_display_name"),

    // Subject (optional — who/what was acted upon)
    subjectSub: text("subject_sub"),
    subjectPrincipalType: text("subject_principal_type"),

    // Resource
    resourceType: text("resource_type"),
    resourceId: text("resource_id"),

    // Action
    action: text("action"),

    // Decision
    allowed: boolean("allowed"),
    reasons: jsonb("reasons"),

    // Context
    metadata: jsonb("metadata").notNull().default({}),
    sourceService: text("source_service").notNull().default("orchestrator-api"),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_audit_tenant_occurred").on(table.tenantId, table.occurredAt),
    index("idx_audit_event_type_occurred").on(
      table.eventType,
      table.occurredAt,
    ),
    index("idx_audit_actor_occurred").on(table.actorSub, table.occurredAt),
    index("idx_audit_resource_occurred").on(
      table.resourceType,
      table.resourceId,
      table.occurredAt,
    ),
    index("idx_audit_request_id").on(table.requestId),
    index("idx_audit_workflow_id").on(table.workflowId),
  ],
);

export type AuditEventRow = typeof auditEvents.$inferSelect;
export type AuditEventInsert = typeof auditEvents.$inferInsert;
