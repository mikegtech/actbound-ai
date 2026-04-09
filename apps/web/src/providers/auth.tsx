/* eslint-disable react-refresh/only-export-components */
import {
  Auth0Provider,
  useAuth0,
  type Auth0ContextInterface,
} from "@auth0/auth0-react";
import { createContext, useCallback, useContext, type ReactNode } from "react";
import { useConfig } from "./config";

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: { email?: string; name?: string; sub?: string } | null;
  getAccessToken: () => Promise<string | null>;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

function Auth0AuthBridge({ children }: { children: ReactNode }) {
  const {
    isAuthenticated,
    isLoading,
    user,
    loginWithRedirect,
    logout,
    getAccessTokenSilently,
  } = useAuth0() as Auth0ContextInterface;

  const getAccessToken = useCallback(async () => {
    try {
      return await getAccessTokenSilently();
    } catch {
      return null;
    }
  }, [getAccessTokenSilently]);

  const handleLogin = useCallback(() => {
    void loginWithRedirect();
  }, [loginWithRedirect]);

  const handleLogout = useCallback(() => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  }, [logout]);

  const state: AuthState = {
    isAuthenticated,
    isLoading,
    user: user ? { email: user.email, name: user.name, sub: user.sub } : null,
    getAccessToken,
    login: handleLogin,
    logout: handleLogout,
  };

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const config = useConfig();

  if (!config.isAuth0Configured) {
    throw new Error(
      "Auth0 is not configured. Set VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID environment variables.",
    );
  }

  return (
    <Auth0Provider
      domain={config.auth0Domain}
      clientId={config.auth0ClientId}
      authorizationParams={{
        redirect_uri: config.auth0CallbackUrl,
        audience: config.auth0Audience,
      }}
    >
      <Auth0AuthBridge>{children}</Auth0AuthBridge>
    </Auth0Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
