import { useMemo } from "react";
import { OrchestratorApiClient } from "@actbound/sdk";
import { useAuth } from "../providers/auth";
import { useConfig } from "../providers/config";

/**
 * Returns an OrchestratorApiClient instance.
 * In Auth0 mode the access token is attached lazily before each request
 * by wrapping the base class constructor with an Authorization header.
 * In demo mode the client works without a token (orchestrator uses demo headers).
 */
export function useApi(): OrchestratorApiClient {
  const config = useConfig();

  return useMemo(
    () =>
      new OrchestratorApiClient(config.orchestratorApiUrl, {
        // Auth0 mode: the token is attached lazily if the caller sets it.
        // For demo mode this is a no-op (empty headers).
      }),
    [config.orchestratorApiUrl],
  );
}

/**
 * Creates a one-shot client with the current access token for imperative calls.
 * Prefer useApi() for hooks; use this for event handlers that need a fresh token.
 */
export function useApiCall() {
  const { getAccessToken, mode } = useAuth();
  const config = useConfig();

  return async function createAuthedClient(): Promise<OrchestratorApiClient> {
    if (mode === "auth0") {
      const token = await getAccessToken();
      return new OrchestratorApiClient(config.orchestratorApiUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    }
    return new OrchestratorApiClient(config.orchestratorApiUrl);
  };
}
