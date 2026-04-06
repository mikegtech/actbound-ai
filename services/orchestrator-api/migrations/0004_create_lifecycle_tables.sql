-- Migration: 0004_create_lifecycle_tables
-- Adds users projection, invitations, revocations, and ownership change tables.
-- These complete the Phase 7 production data model alignment.

-- ── Users (app projection of Auth0 identities) ────────────
CREATE TABLE IF NOT EXISTS users (
  sub TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  display_name TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_tenant ON users (tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- ── Invitations ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invitations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  organization_id TEXT REFERENCES organizations(id),
  resource_id TEXT,
  target_sub TEXT,
  target_email TEXT,
  invitation_type TEXT NOT NULL DEFAULT 'membership',
  status TEXT NOT NULL DEFAULT 'pending',
  invited_by TEXT,
  expires_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inv_tenant ON invitations (tenant_id);
CREATE INDEX IF NOT EXISTS idx_inv_org ON invitations (organization_id);
CREATE INDEX IF NOT EXISTS idx_inv_target_sub ON invitations (target_sub);
CREATE INDEX IF NOT EXISTS idx_inv_status ON invitations (status);

-- ── Revocations ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS revocations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  organization_id TEXT,
  resource_id TEXT,
  subject_sub TEXT,
  assistant_id TEXT,
  revocation_type TEXT NOT NULL,
  reason TEXT,
  revoked_by TEXT,
  effective_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rev_tenant ON revocations (tenant_id);
CREATE INDEX IF NOT EXISTS idx_rev_subject ON revocations (subject_sub);
CREATE INDEX IF NOT EXISTS idx_rev_resource ON revocations (resource_id);

-- ── Ownership Changes ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS ownership_changes (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  resource_id TEXT NOT NULL,
  previous_owner_type TEXT,
  previous_owner_id TEXT,
  new_owner_type TEXT NOT NULL,
  new_owner_id TEXT NOT NULL,
  changed_by TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_own_resource ON ownership_changes (resource_id);
CREATE INDEX IF NOT EXISTS idx_own_tenant ON ownership_changes (tenant_id);
