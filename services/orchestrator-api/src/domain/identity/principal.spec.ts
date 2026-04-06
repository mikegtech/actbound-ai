import { describe, it, expect } from "vitest";
import { principalFromClaims, demoPrincipal, CLAIM_KEYS } from "./principal";

describe("principalFromClaims", () => {
  it("extracts user principal from JWT claims", () => {
    const claims = {
      sub: "auth0|abc123",
      aud: "https://api.actbound.dev",
      [CLAIM_KEYS.principalType]: "user",
      [CLAIM_KEYS.roles]: ["operator"],
      [CLAIM_KEYS.tenantId]: "tenant_acme",
    };

    const principal = principalFromClaims(claims);

    expect(principal.sub).toBe("auth0|abc123");
    expect(principal.principalType).toBe("user");
    expect(principal.roles).toEqual(["operator"]);
    expect(principal.tenantId).toBe("tenant_acme");
    expect(principal.authenticated).toBe(true);
  });

  it("extracts service principal from M2M token", () => {
    const claims = {
      sub: "svc_orchestrator@clients",
      [CLAIM_KEYS.principalType]: "service",
      [CLAIM_KEYS.roles]: ["service"],
      [CLAIM_KEYS.tenantId]: "tenant_default",
      [CLAIM_KEYS.serviceName]: "orchestrator-api",
    };

    const principal = principalFromClaims(claims);

    expect(principal.principalType).toBe("service");
    expect(principal.roles).toEqual(["service"]);
    expect(principal.serviceName).toBe("orchestrator-api");
  });

  it("extracts agent principal with delegation", () => {
    const claims = {
      sub: "agent_research_001@clients",
      [CLAIM_KEYS.principalType]: "agent",
      [CLAIM_KEYS.roles]: ["agent"],
      [CLAIM_KEYS.tenantId]: "tenant_acme",
      [CLAIM_KEYS.agentType]: "research",
      [CLAIM_KEYS.agentInstanceId]: "agent_research_001",
      [CLAIM_KEYS.onBehalfOf]: "auth0|abc123",
    };

    const principal = principalFromClaims(claims);

    expect(principal.principalType).toBe("agent");
    expect(principal.agentType).toBe("research");
    expect(principal.agentInstanceId).toBe("agent_research_001");
    expect(principal.onBehalfOf).toBe("auth0|abc123");
  });

  it("infers service type from @clients sub format", () => {
    const claims = {
      sub: "some_client_id@clients",
      // No explicit principal_type claim
    };

    const principal = principalFromClaims(claims);

    expect(principal.principalType).toBe("service");
    expect(principal.roles).toEqual(["service"]);
  });

  it("defaults to user type for unknown sub format", () => {
    const claims = {
      sub: "auth0|unknown",
    };

    const principal = principalFromClaims(claims);

    expect(principal.principalType).toBe("user");
    expect(principal.roles).toEqual(["viewer"]);
    expect(principal.tenantId).toBe("default");
  });

  it("extracts azp as clientId", () => {
    const claims = {
      sub: "auth0|user1",
      azp: "VKm1ClfzHqI0VSKtjtzAtBDbgeBXAVLp",
      [CLAIM_KEYS.principalType]: "user",
    };

    const principal = principalFromClaims(claims);

    expect(principal.clientId).toBe("VKm1ClfzHqI0VSKtjtzAtBDbgeBXAVLp");
  });
});

describe("demoPrincipal", () => {
  it("creates a demo principal with defaults", () => {
    const principal = demoPrincipal();

    expect(principal.sub).toBe("demo-user");
    expect(principal.principalType).toBe("user");
    expect(principal.roles).toEqual(["operator"]);
    expect(principal.authenticated).toBe(false);
  });

  it("accepts overrides", () => {
    const principal = demoPrincipal({
      sub: "test-user",
      roles: ["admin"],
    });

    expect(principal.sub).toBe("test-user");
    expect(principal.roles).toEqual(["admin"]);
    expect(principal.authenticated).toBe(false);
  });
});
