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
  pgTable,
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

// ── App tables (public schema) ──────────────────────────────

export const organizations = pgTable("organizations", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().default("default"),
  name: text("name").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const assistants = pgTable("assistants", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().default("default"),
  organizationId: text("organization_id").references(() => organizations.id),
  name: text("name").notNull(),
  assistantType: text("assistant_type").notNull().default("general"),
  runtimeMode: text("runtime_mode").notNull().default("managed"),
  status: text("status").notNull().default("active"),
  description: text("description"),
  createdBy: text("created_by"),
  updatedBy: text("updated_by"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const resources = pgTable("resources", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().default("default"),
  organizationId: text("organization_id").references(() => organizations.id),
  resourceType: text("resource_type").notNull().default("document"),
  displayName: text("display_name").notNull(),
  status: text("status").notNull().default("active"),
  ownerType: text("owner_type"),
  ownerId: text("owner_id"),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── Users (app projection) ────────────────────────────────

export const users = pgTable("users", {
  sub: text("sub").primaryKey(),
  tenantId: text("tenant_id").notNull().default("default"),
  displayName: text("display_name"),
  email: text("email"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── Invitations ───────────────────────────────────────────

export const invitations = pgTable("invitations", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().default("default"),
  organizationId: text("organization_id").references(() => organizations.id),
  resourceId: text("resource_id"),
  targetSub: text("target_sub"),
  targetEmail: text("target_email"),
  invitationType: text("invitation_type").notNull().default("membership"),
  status: text("status").notNull().default("pending"),
  invitedBy: text("invited_by"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── Revocations ───────────────────────────────────────────

export const revocations = pgTable("revocations", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().default("default"),
  organizationId: text("organization_id"),
  resourceId: text("resource_id"),
  subjectSub: text("subject_sub"),
  assistantId: text("assistant_id"),
  revocationType: text("revocation_type").notNull(),
  reason: text("reason"),
  revokedBy: text("revoked_by"),
  effectiveAt: timestamp("effective_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── Ownership Changes ─────────────────────────────────────

export const ownershipChanges = pgTable("ownership_changes", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().default("default"),
  resourceId: text("resource_id").notNull(),
  previousOwnerType: text("previous_owner_type"),
  previousOwnerId: text("previous_owner_id"),
  newOwnerType: text("new_owner_type").notNull(),
  newOwnerId: text("new_owner_id").notNull(),
  changedBy: text("changed_by"),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type OrganizationRow = typeof organizations.$inferSelect;
export type AssistantRow = typeof assistants.$inferSelect;
export type ResourceRow = typeof resources.$inferSelect;
export type UserRow = typeof users.$inferSelect;
export type InvitationRow = typeof invitations.$inferSelect;
export type RevocationRow = typeof revocations.$inferSelect;
export type OwnershipChangeRow = typeof ownershipChanges.$inferSelect;
