-- Migration: 0002_move_audit_to_schema
-- Moves audit_events from public schema into a dedicated audit schema.
-- Safe for both fresh installations and existing dev setups.

-- Create the audit schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS audit;

-- Move the table if it exists in public and not yet in audit
DO $$
BEGIN
  -- Check if the table exists in public schema
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'audit_events'
  ) THEN
    -- Check if it does NOT exist in audit schema yet
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'audit' AND table_name = 'audit_events'
    ) THEN
      -- Move the table (preserves data and indexes)
      ALTER TABLE public.audit_events SET SCHEMA audit;
      RAISE NOTICE 'Moved audit_events from public to audit schema';
    ELSE
      RAISE NOTICE 'audit.audit_events already exists, skipping move';
    END IF;
  ELSE
    -- Fresh install: create directly in audit schema
    CREATE TABLE IF NOT EXISTS audit.audit_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id TEXT NOT NULL DEFAULT 'default',
      event_type TEXT NOT NULL,
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      request_id TEXT,
      workflow_id TEXT,
      actor_sub TEXT NOT NULL,
      actor_principal_type TEXT NOT NULL,
      actor_display_name TEXT,
      subject_sub TEXT,
      subject_principal_type TEXT,
      resource_type TEXT,
      resource_id TEXT,
      action TEXT,
      allowed BOOLEAN,
      reasons JSONB,
      metadata JSONB NOT NULL DEFAULT '{}',
      source_service TEXT NOT NULL DEFAULT 'orchestrator-api',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_audit_tenant_occurred ON audit.audit_events (tenant_id, occurred_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_event_type_occurred ON audit.audit_events (event_type, occurred_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_actor_occurred ON audit.audit_events (actor_sub, occurred_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_resource_occurred ON audit.audit_events (resource_type, resource_id, occurred_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_request_id ON audit.audit_events (request_id);
    CREATE INDEX IF NOT EXISTS idx_audit_workflow_id ON audit.audit_events (workflow_id);

    RAISE NOTICE 'Created audit.audit_events (fresh install)';
  END IF;
END $$;
