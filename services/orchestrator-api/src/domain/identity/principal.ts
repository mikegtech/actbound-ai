/**
 * Normalized principal model — domain layer.
 *
 * Represents the authenticated identity for any request.
 * Extracted from Auth0 JWTs or demo headers.
 * No NestJS, no jose, no framework imports.
 */

export type PrincipalType = "user" | "service" | "agent";

export interface Principal {
  /** Auth0 `sub` claim. Unique identity. */
  sub: string;
  /** Normalized principal type from custom claim. */
  principalType: PrincipalType;
  /** Roles from custom claim. */
  roles: string[];
  /** Tenant/org boundary. */
  tenantId: string;
  /** Auth0 `azp` / `client_id` — identifies the application. */
  clientId?: string;
  /** For agents: the user sub this agent acts on behalf of. */
  onBehalfOf?: string;
  /** Agent type classification (research, execution, etc.) */
  agentType?: string;
  /** Agent instance identifier. */
  agentInstanceId?: string;
  /** Service name for M2M tokens. */
  serviceName?: string;
  /** Whether this principal came from a real JWT (true) or demo headers (false). */
  authenticated: boolean;
}

/** Custom claim namespace per ADR-006. */
export const CLAIM_NAMESPACE = "https://actbound.ai/";

export const CLAIM_KEYS = {
  principalType: `${CLAIM_NAMESPACE}principal_type`,
  roles: `${CLAIM_NAMESPACE}roles`,
  tenantId: `${CLAIM_NAMESPACE}tenant_id`,
  agentType: `${CLAIM_NAMESPACE}agent_type`,
  agentInstanceId: `${CLAIM_NAMESPACE}agent_instance_id`,
  onBehalfOf: `${CLAIM_NAMESPACE}on_behalf_of`,
  serviceName: `${CLAIM_NAMESPACE}service_name`,
} as const;

/**
 * Extract a normalized Principal from JWT payload claims.
 */
export function principalFromClaims(
  claims: Record<string, unknown>,
): Principal {
  const sub = String(claims.sub ?? "unknown");
  const principalType = parsePrincipalType(
    claims[CLAIM_KEYS.principalType] as string | undefined,
    sub,
  );

  return {
    sub,
    principalType,
    roles: Array.isArray(claims[CLAIM_KEYS.roles])
      ? (claims[CLAIM_KEYS.roles] as string[])
      : principalType === "service"
        ? ["service"]
        : principalType === "agent"
          ? ["agent"]
          : ["viewer"],
    tenantId: String(claims[CLAIM_KEYS.tenantId] ?? "default"),
    clientId: claims.azp ? String(claims.azp) : undefined,
    onBehalfOf: claims[CLAIM_KEYS.onBehalfOf]
      ? String(claims[CLAIM_KEYS.onBehalfOf])
      : undefined,
    agentType: claims[CLAIM_KEYS.agentType]
      ? String(claims[CLAIM_KEYS.agentType])
      : undefined,
    agentInstanceId: claims[CLAIM_KEYS.agentInstanceId]
      ? String(claims[CLAIM_KEYS.agentInstanceId])
      : undefined,
    serviceName: claims[CLAIM_KEYS.serviceName]
      ? String(claims[CLAIM_KEYS.serviceName])
      : undefined,
    authenticated: true,
  };
}

/**
 * Create a demo principal for unauthenticated/demo mode.
 */
export function demoPrincipal(overrides: Partial<Principal> = {}): Principal {
  return {
    sub: "demo-user",
    principalType: "user",
    roles: ["operator"],
    tenantId: "demo-tenant",
    authenticated: false,
    ...overrides,
  };
}

function parsePrincipalType(
  value: string | undefined,
  sub: string,
): PrincipalType {
  if (value === "user" || value === "service" || value === "agent") {
    return value;
  }
  // Infer from sub format: M2M clients end with @clients
  if (sub.endsWith("@clients")) return "service";
  return "user";
}
