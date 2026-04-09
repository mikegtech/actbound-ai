/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, type ReactNode } from "react";

export interface AppConfig {
  auth0Domain: string;
  auth0ClientId: string;
  auth0Audience: string;
  auth0CallbackUrl: string;
  orchestratorApiUrl: string;
  isAuth0Configured: boolean;
}

const ConfigContext = createContext<AppConfig | null>(null);

function resolveConfig(): AppConfig {
  const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN ?? "";
  const auth0ClientId = import.meta.env.VITE_AUTH0_CLIENT_ID ?? "";
  const auth0Audience =
    import.meta.env.VITE_AUTH0_AUDIENCE ?? "https://api.actbound.ai";
  const auth0CallbackUrl =
    import.meta.env.VITE_AUTH0_CALLBACK_URL ??
    `${window.location.origin}/callback`;
  const orchestratorApiUrl =
    import.meta.env.VITE_ORCHESTRATOR_API_URL ?? "http://localhost:3001";

  return {
    auth0Domain,
    auth0ClientId,
    auth0Audience,
    auth0CallbackUrl,
    orchestratorApiUrl,
    isAuth0Configured: Boolean(auth0Domain && auth0ClientId),
  };
}

export function ConfigProvider({ children }: { children: ReactNode }) {
  const config = useMemo(resolveConfig, []);
  return (
    <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
  );
}

export function useConfig(): AppConfig {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error("useConfig must be used within ConfigProvider");
  return ctx;
}
