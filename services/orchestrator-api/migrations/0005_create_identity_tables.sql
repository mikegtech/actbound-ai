-- Migration: 0005_create_identity_tables
-- Adds multi-issuer identity infrastructure for Phase 7.
-- Creates trusted_issuers registry and identity_bindings table.
-- Evolves users table to support multiple identity providers.

-- ── Trusted Issuers Registry ─────────────────────────────
-- Per-tenant configuration of which OIDC providers are trusted.
-- Auth0 is first provider; Keycloak next (Tier 1).
CREATE TABLE IF NOT EXISTS trusted_issuers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  issuer_type TEXT NOT NULL CHECK (issuer_type IN ('auth0', 'keycloak', 'okta', 'oidc')),
  issuer_url TEXT NOT NULL,
  display_name TEXT NOT NULL,
  audience TEXT,
  jwks_url TEXT,
  discovery_url TEXT,
  claim_mapping_profile TEXT NOT NULL DEFAULT 'default',
  enabled BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, issuer_url)
);

CREATE INDEX IF NOT EXISTS idx_ti_tenant ON trusted_issuers (tenant_id);
CREATE INDEX IF NOT EXISTS idx_ti_issuer_url ON trusted_issuers (issuer_url);
CREATE INDEX IF NOT EXISTS idx_ti_enabled ON trusted_issuers (tenant_id, enabled);

-- ── Identity Bindings ────────────────────────────────────
-- Maps external identity (issuer + sub) to internal subject ID.
-- Internal subject is used in OpenFGA, audit, and all authorization.
CREATE TABLE IF NOT EXISTS identity_bindings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer TEXT NOT NULL,
  external_sub TEXT NOT NULL,
  internal_subject_id UUID NOT NULL,
  issuer_type TEXT NOT NULL CHECK (issuer_type IN ('auth0', 'keycloak', 'okta', 'oidc')),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  display_name TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (issuer, external_sub)
);

CREATE INDEX IF NOT EXISTS idx_ib_internal ON identity_bindings (internal_subject_id);
CREATE INDEX IF NOT EXISTS idx_ib_tenant ON identity_bindings (tenant_id);
CREATE INDEX IF NOT EXISTS idx_ib_issuer_sub ON identity_bindings (issuer, external_sub);

-- ── Users table evolution ────────────────────────────────
-- Add internal_id column to users table for multi-issuer support.
-- The sub column remains for backwards compatibility during transition.
-- New code should use internal_id for OpenFGA and authorization.
ALTER TABLE users ADD COLUMN IF NOT EXISTS internal_id UUID DEFAULT gen_random_uuid();
ALTER TABLE users ADD COLUMN IF NOT EXISTS issuer TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS issuer_type TEXT;

-- Index for internal_id lookups
CREATE INDEX IF NOT EXISTS idx_users_internal_id ON users (internal_id);
CREATE INDEX IF NOT EXISTS idx_users_issuer ON users (issuer, sub);
