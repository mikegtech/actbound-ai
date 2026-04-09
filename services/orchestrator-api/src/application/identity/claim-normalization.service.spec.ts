import { describe, it, expect } from "vitest";
import { ClaimNormalizationService } from "./claim-normalization.service";

describe("ClaimNormalizationService", () => {
  const service = new ClaimNormalizationService();

  it("normalizes Auth0 claims using the auth0-default profile", () => {
    const result = service.normalize(
      "auth0",
      "https://auth.actbound.ai/",
      "auth0-default",
      {
        sub: "auth0|abc123",
        iss: "https://auth.actbound.ai/",
        "https://actbound.ai/principal_type": "user",
        "https://actbound.ai/roles": ["admin"],
        "https://actbound.ai/tenant_id": "acme",
      },
    );

    expect(result.externalSub).toBe("auth0|abc123");
    expect(result.principalType).toBe("user");
    expect(result.roles).toEqual(["admin"]);
    expect(result.tenantId).toBe("acme");
  });

  it("falls back to default profile when unknown profile ID is given", () => {
    const result = service.normalize(
      "auth0",
      "https://auth.actbound.ai/",
      "nonexistent",
      {
        sub: "auth0|xyz",
        "https://actbound.ai/principal_type": "user",
        "https://actbound.ai/tenant_id": "default",
      },
    );

    expect(result.externalSub).toBe("auth0|xyz");
    expect(result.principalType).toBe("user");
  });

  it("has normalizer for auth0 issuer type", () => {
    expect(service.hasNormalizer("auth0")).toBe(true);
  });

  it("has normalizer for oidc issuer type (reuses auth0)", () => {
    expect(service.hasNormalizer("oidc")).toBe(true);
  });

  it("does not have normalizer for keycloak yet", () => {
    expect(service.hasNormalizer("keycloak")).toBe(false);
  });

  it("throws for unsupported issuer type", () => {
    expect(() =>
      service.normalize(
        "keycloak",
        "https://sso.example.com/",
        "keycloak-default",
        {
          sub: "user1",
        },
      ),
    ).toThrow("No claim normalizer registered for issuer type: keycloak");
  });
});
