import { useMemo } from "react";
import { OrchestratorApiClient } from "@actbound/sdk";
import { useAuth } from "../providers/auth";
import { useConfig } from "../providers/config";

/**
 * Returns an OrchestratorApiClient instance.
 * Access token is attached lazily before each request via the Authorization header.
 */
export function useApi(): OrchestratorApiClient {
  const config = useConfig();

  return useMemo(
    () => new OrchestratorApiClient(config.orchestratorApiUrl),
    [config.orchestratorApiUrl],
  );
}

/**
 * Creates a one-shot client with the current access token for imperative calls.
 * Prefer useApi() for hooks; use this for event handlers that need a fresh token.
 */
export function useApiCall() {
  const { getAccessToken } = useAuth();
  const config = useConfig();

  return async function createAuthedClient(): Promise<OrchestratorApiClient> {
    const token = await getAccessToken();
    return new OrchestratorApiClient(config.orchestratorApiUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  };
}
