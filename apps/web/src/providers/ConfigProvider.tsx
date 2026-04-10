import { createContext, useContext, ReactNode } from "react";

interface GlobalConfig {
  auth0Domain: string;
  auth0ClientId: string;
  auth0Audience: string;
  auth0CallbackUrl: string;
  orchestratorApiUrl: string;
  isAuth0Configured: boolean;
}

const ConfigContext = createContext<GlobalConfig | null>(null);

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN || "";
  const auth0ClientId = import.meta.env.VITE_AUTH0_CLIENT_ID || "";
  const auth0Audience = import.meta.env.VITE_AUTH0_AUDIENCE || "";
  const auth0CallbackUrl =
    import.meta.env.VITE_AUTH0_CALLBACK_URL ||
    `${window.location.origin}/callback`;
  const orchestratorApiUrl =
    import.meta.env.VITE_ORCHESTRATOR_API_URL || "http://localhost:3001";

  const isAuth0Configured = Boolean(
    auth0Domain && auth0ClientId && auth0Audience,
  );

  const config: GlobalConfig = {
    auth0Domain,
    auth0ClientId,
    auth0Audience,
    auth0CallbackUrl,
    orchestratorApiUrl,
    isAuth0Configured,
  };

  return (
    <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
  );
};

export const useGlobalConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw "useGlobalConfig must be used within a ConfigProvider";
  }
  return context;
};
