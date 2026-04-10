import { Navigate } from "@tanstack/react-router";
import { useAuth } from "providers/AuthProvider";
import type { PropsWithChildren } from "react";
import paths from "routes/paths";

const GuestGuard = ({ children }: PropsWithChildren) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return isAuthenticated ? <Navigate to={paths.dashboard} replace /> : children;
};

export default GuestGuard;
