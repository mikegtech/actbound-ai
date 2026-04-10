import { Navigate } from "@tanstack/react-router";
import { useAuth } from "providers/AuthProvider";
import type { PropsWithChildren } from "react";
import paths from "routes/paths";

const AuthGuard = ({ children }: PropsWithChildren) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return isAuthenticated ? children : <Navigate to={paths.login} replace />;
};

export default AuthGuard;
