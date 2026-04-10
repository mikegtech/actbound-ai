import { Auth0Provider, type User, useAuth0 } from "@auth0/auth0-react";
import { PropsWithChildren, useEffect, createContext, useContext } from "react";
import { useGlobalConfig } from "./ConfigProvider";
import { setAuthTokenGetter } from "services/axios/axiosInstance";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user?: User;
  getAccessToken: () => Promise<string>;
  login: () => Promise<void>;
  logout: () => void;
}

const GlobalAuthContext = createContext<AuthState | null>(null);

const AuthManager = ({ children }: PropsWithChildren) => {
  const {
    isAuthenticated,
    isLoading,
    user,
    getAccessTokenSilently,
    loginWithRedirect,
    logout: auth0Logout,
  } = useAuth0();

  useEffect(() => {
    // Bind the silent token generator strictly to our global API interception layer
    setAuthTokenGetter(getAccessTokenSilently);
  }, [getAccessTokenSilently]);

  const login = async () => {
    await loginWithRedirect();
  };

  const logout = () => {
    auth0Logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const getAccessToken = async () => {
    return await getAccessTokenSilently();
  };

  const state: AuthState = {
    isAuthenticated,
    isLoading,
    user,
    getAccessToken,
    login,
    logout,
  };

  return (
    <GlobalAuthContext.Provider value={state}>
      {children}
    </GlobalAuthContext.Provider>
  );
};

const AuthProvider = ({ children }: PropsWithChildren) => {
  const config = useGlobalConfig();

  if (!config.isAuth0Configured) {
    throw new Error(
      "Auth0 missing configuration! VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID are required.",
    );
  }

  return (
    <Auth0Provider
      domain={config.auth0Domain}
      clientId={config.auth0ClientId}
      authorizationParams={{
        audience: config.auth0Audience,
        redirect_uri: config.auth0CallbackUrl,
      }}
      cacheLocation="localstorage"
    >
      <AuthManager>{children}</AuthManager>
    </Auth0Provider>
  );
};

export const useAuth = () => {
  const context = useContext(GlobalAuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthProvider;
