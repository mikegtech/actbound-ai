import { describe, it, expect } from "vitest";
import { Auth0ClaimNormalizer } from "./auth0-claim-normalizer";
import { AUTH0_CLAIM_PROFILE } from "../../domain/identity/issuer-types";

describe("Auth0ClaimNormalizer", () => {
  const normalizer = new Auth0ClaimNormalizer();

  it("normalizes a standard user token", () => {
    const result = normalizer.normalize({
      payload: {
        sub: "auth0|abc123",
        iss: "https://auth.actbound.ai/",
        aud: "https://api.actbound.ai",
        azp: "VKm1ClfzHqI0VSKtjtzAtBDbgeBXAVLp",
        "https://actbound.ai/principal_type": "user",
        "https://actbound.ai/roles": ["admin", "operator"],
        "https://actbound.ai/tenant_id": "acme",
      },
      issuer: "https://auth.actbound.ai/",
      issuerType: "auth0",
      profile: AUTH0_CLAIM_PROFILE,
    });

    expect(result.externalSub).toBe("auth0|abc123");
    expect(result.issuer).toBe("https://auth.actbound.ai/");
    expect(result.issuerType).toBe("auth0");
    expect(result.principalType).toBe("user");
    expect(result.roles).toEqual(["admin", "operator"]);
    expect(result.tenantId).toBe("acme");
    expect(result.clientId).toBe("VKm1ClfzHqI0VSKtjtzAtBDbgeBXAVLp");
  });

  it("normalizes an M2M service token", () => {
    const result = normalizer.normalize({
      payload: {
        sub: "ljGntsIp3TqZrXxvvdjNzH9MONSX68OQ@clients",
        iss: "https://auth.actbound.ai/",
        aud: "https://api.actbound.ai",
        "https://actbound.ai/principal_type": "service",
        "https://actbound.ai/tenant_id": "default",
        "https://actbound.ai/service_name": "sync-service",
      },
      issuer: "https://auth.actbound.ai/",
      issuerType: "auth0",
      profile: AUTH0_CLAIM_PROFILE,
    });

    expect(result.principalType).toBe("service");
    expect(result.serviceName).toBe("sync-service");
    expect(result.roles).toEqual(["service"]);
  });

  it("normalizes an agent token with delegation", () => {
    const result = normalizer.normalize({
      payload: {
        sub: "agent-client-id@clients",
        iss: "https://auth.actbound.ai/",
        "https://actbound.ai/principal_type": "agent",
        "https://actbound.ai/roles": ["agent"],
        "https://actbound.ai/tenant_id": "acme",
        "https://actbound.ai/on_behalf_of": "auth0|user123",
        "https://actbound.ai/agent_instance_id": "inst-001",
        "https://actbound.ai/agent_type": "research",
      },
      issuer: "https://auth.actbound.ai/",
      issuerType: "auth0",
      profile: AUTH0_CLAIM_PROFILE,
    });

    expect(result.principalType).toBe("agent");
    expect(result.onBehalfOf).toBe("auth0|user123");
    expect(result.agentInstanceId).toBe("inst-001");
    expect(result.agentType).toBe("research");
  });

  it("infers service type from @clients sub suffix", () => {
    const result = normalizer.normalize({
      payload: {
        sub: "some-client@clients",
        iss: "https://auth.actbound.ai/",
      },
      issuer: "https://auth.actbound.ai/",
      issuerType: "auth0",
      profile: AUTH0_CLAIM_PROFILE,
    });

    expect(result.principalType).toBe("service");
  });

  it("defaults to user type for unknown sub format", () => {
    const result = normalizer.normalize({
      payload: {
        sub: "google-oauth2|123456",
        iss: "https://auth.actbound.ai/",
      },
      issuer: "https://auth.actbound.ai/",
      issuerType: "auth0",
      profile: AUTH0_CLAIM_PROFILE,
    });

    expect(result.principalType).toBe("user");
    expect(result.roles).toEqual(["viewer"]);
    expect(result.tenantId).toBe("default");
  });

  it("rejects tokens missing sub claim gracefully", () => {
    const result = normalizer.normalize({
      payload: {
        iss: "https://auth.actbound.ai/",
      },
      issuer: "https://auth.actbound.ai/",
      issuerType: "auth0",
      profile: AUTH0_CLAIM_PROFILE,
    });

    expect(result.externalSub).toBe("unknown");
  });
});
