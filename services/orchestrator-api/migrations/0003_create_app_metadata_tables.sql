-- Migration: 0003_create_app_metadata_tables
-- Creates minimal runtime-critical metadata tables in the public schema.
-- These are the authoritative source of truth for entity metadata/state.
-- OpenFGA stores relationships only. Audit stores history only.

-- ── Organizations ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_tenant ON organizations (tenant_id);

-- ── Assistants ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assistants (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  organization_id TEXT REFERENCES organizations(id),
  name TEXT NOT NULL,
  assistant_type TEXT NOT NULL DEFAULT 'general',
  runtime_mode TEXT NOT NULL DEFAULT 'managed',
  status TEXT NOT NULL DEFAULT 'active',
  description TEXT,
  created_by TEXT,
  updated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assistant_tenant ON assistants (tenant_id);
CREATE INDEX IF NOT EXISTS idx_assistant_org ON assistants (organization_id);
CREATE INDEX IF NOT EXISTS idx_assistant_status ON assistants (status);

-- ── Resources ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  organization_id TEXT REFERENCES organizations(id),
  resource_type TEXT NOT NULL DEFAULT 'document',
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  owner_type TEXT,
  owner_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resource_tenant ON resources (tenant_id);
CREATE INDEX IF NOT EXISTS idx_resource_org ON resources (organization_id);
CREATE INDEX IF NOT EXISTS idx_resource_type ON resources (resource_type);
CREATE INDEX IF NOT EXISTS idx_resource_owner ON resources (owner_type, owner_id);
