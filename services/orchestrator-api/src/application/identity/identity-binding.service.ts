import { Inject, Injectable, Logger } from "@nestjs/common";
import type {
  IdentityBinding,
  IdentityBindingRepository,
} from "../../domain/identity/identity-binding";
import type { IssuerType } from "../../domain/identity/issuer-types";

/**
 * Identity binding service.
 *
 * Resolves `issuer + external_sub` → `internal_subject_id`.
 * On first login from a trusted issuer: auto-provisions a binding.
 * On subsequent logins: resolves the existing binding.
 * Missing binding for unknown issuers: fail-closed.
 *
 * The internal subject ID is used in OpenFGA, audit, and all authorization.
 * External subs (e.g., "auth0|abc123") are never used in downstream authorization.
 */
@Injectable()
export class IdentityBindingService {
  private readonly logger = new Logger(IdentityBindingService.name);

  constructor(
    @Inject("IDENTITY_BINDING_REPOSITORY")
    private readonly repository: IdentityBindingRepository,
  ) {}

  /**
   * Resolve or create an identity binding.
   *
   * For trusted issuers: auto-provisions on first login.
   * Updates last login timestamp on subsequent logins.
   *
   * @returns The identity binding with the internal subject ID.
   * @throws If the database is unavailable (fail-closed).
   */
  async resolveOrCreate(input: {
    issuer: string;
    externalSub: string;
    issuerType: IssuerType;
    tenantId: string;
    displayName?: string;
    email?: string;
  }): Promise<IdentityBinding> {
    // Try to find existing binding
    const existing = await this.repository.findByExternalIdentity(
      input.issuer,
      input.externalSub,
    );

    if (existing) {
      if (existing.status !== "active") {
        throw new Error(
          `Identity binding is ${existing.status} for ${input.issuer}|${input.externalSub}`,
        );
      }

      // Update last login
      await this.repository.touchLastLogin(existing.id);

      this.logger.debug(
        `Resolved binding: ${input.issuer}|${input.externalSub} → ${existing.internalSubjectId}`,
      );

      return existing;
    }

    // Auto-provision: create new binding for trusted issuer
    const binding = await this.repository.create({
      issuer: input.issuer,
      externalSub: input.externalSub,
      issuerType: input.issuerType,
      tenantId: input.tenantId,
      displayName: input.displayName,
      email: input.email,
    });

    this.logger.log(
      `Auto-provisioned binding: ${input.issuer}|${input.externalSub} → ${binding.internalSubjectId}`,
    );

    return binding;
  }

  /**
   * Find a binding by internal subject ID.
   * Used for reverse lookups (e.g., audit display).
   */
  async findByInternalSubject(
    internalSubjectId: string,
  ): Promise<IdentityBinding | null> {
    return this.repository.findByInternalSubject(internalSubjectId);
  }

  /**
   * List all bindings for a tenant.
   * Used for admin views.
   */
  async findByTenant(tenantId: string): Promise<IdentityBinding[]> {
    return this.repository.findByTenant(tenantId);
  }
}
