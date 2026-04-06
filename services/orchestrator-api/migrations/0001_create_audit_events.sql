-- Migration: 0001_create_audit_events
-- Creates the durable audit event storage table.

CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  event_type TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Correlation
  request_id TEXT,
  workflow_id TEXT,

  -- Actor
  actor_sub TEXT NOT NULL,
  actor_principal_type TEXT NOT NULL,
  actor_display_name TEXT,

  -- Subject
  subject_sub TEXT,
  subject_principal_type TEXT,

  -- Resource
  resource_type TEXT,
  resource_id TEXT,

  -- Action + Decision
  action TEXT,
  allowed BOOLEAN,
  reasons JSONB,

  -- Context
  metadata JSONB NOT NULL DEFAULT '{}',
  source_service TEXT NOT NULL DEFAULT 'orchestrator-api',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_tenant_occurred ON audit_events (tenant_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_event_type_occurred ON audit_events (event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor_occurred ON audit_events (actor_sub, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_resource_occurred ON audit_events (resource_type, resource_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_request_id ON audit_events (request_id);
CREATE INDEX IF NOT EXISTS idx_audit_workflow_id ON audit_events (workflow_id);
