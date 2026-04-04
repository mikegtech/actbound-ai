/* eslint-disable react-refresh/only-export-components */
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { ConfigProvider } from "./providers/config";
import { AuthProvider, useAuth } from "./providers/auth";
import { LoginPage } from "./pages/login";
import { DashboardPage } from "./pages/dashboard";
import "./index.css";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <p className="dash-loading">Authenticating...</p>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <AuthRedirect>
            <LoginPage />
          </AuthRedirect>
        }
      />
      <Route path="/callback" element={<Navigate to="/" replace />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
