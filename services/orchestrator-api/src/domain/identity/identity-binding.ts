/**
 * Identity binding — domain types.
 *
 * Maps external identity (issuer + sub) to internal subject ID.
 * OpenFGA, audit, and authorization use the internal ID, never raw external claims.
 *
 * No infrastructure imports.
 */

import type { IssuerType } from "./issuer-types.js";

export interface IdentityBinding {
  id: string;
  issuer: string;
  externalSub: string;
  internalSubjectId: string;
  issuerType: IssuerType;
  tenantId: string;
  displayName?: string;
  email?: string;
  status: "active" | "suspended" | "deleted";
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIdentityBindingInput {
  issuer: string;
  externalSub: string;
  issuerType: IssuerType;
  tenantId: string;
  displayName?: string;
  email?: string;
}

export interface IdentityBindingRepository {
  /** Find binding by issuer + external sub. Returns null if not found. */
  findByExternalIdentity(
    issuer: string,
    externalSub: string,
  ): Promise<IdentityBinding | null>;

  /** Find binding by internal subject ID. */
  findByInternalSubject(
    internalSubjectId: string,
  ): Promise<IdentityBinding | null>;

  /** Find all bindings for a tenant. */
  findByTenant(tenantId: string): Promise<IdentityBinding[]>;

  /** Create a new identity binding. Returns the created binding with generated internal subject ID. */
  create(input: CreateIdentityBindingInput): Promise<IdentityBinding>;

  /** Update last login timestamp. */
  touchLastLogin(id: string): Promise<void>;
}
