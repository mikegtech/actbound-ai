import { useState, type FormEvent } from "react";
import { useAuth } from "../providers/auth";

export function LoginPage() {
  const { login, mode } = useAuth();
  const [email, setEmail] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    login();
  }

  return (
    <div className="login-shell">
      <header className="login-topbar">
        <div className="login-topbar__brand">
          <span className="login-topbar__icon">◆</span> ActBound AI
        </div>
        <nav className="login-topbar__nav">
          <span>Platform</span>
          <span>Security</span>
          <span>Documentation</span>
        </nav>
        <div className="login-topbar__status">
          <span className="status-dot" /> System Status
        </div>
      </header>

      <main className="login-main">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-card__logo">⬡</div>
          <h1 className="login-card__title">ActBound AI</h1>
          <p className="login-card__subtitle">Zero Trust Engine</p>

          <label className="login-field">
            <span className="login-field__label">
              Identity Endpoint (Email)
            </span>
            <div className="login-field__input-wrap">
              <span className="login-field__icon">@</span>
              <input
                type="email"
                placeholder={
                  mode === "auth0" ? "name@company.ai" : "alice@actbound.dev"
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-field__input"
              />
            </div>
          </label>

          <label className="login-field">
            <span className="login-field__label-row">
              <span className="login-field__label">Access Key (Password)</span>
              <span className="login-field__link">Forgot password?</span>
            </span>
            <div className="login-field__input-wrap">
              <span className="login-field__icon">⚿</span>
              <input
                type="password"
                placeholder="••••••••••"
                className="login-field__input"
              />
            </div>
          </label>

          <button type="submit" className="login-card__submit">
            Initialize Session →
          </button>

          <div className="login-card__divider">
            <span>Or authenticate via</span>
          </div>

          <div className="login-card__social">
            <button
              type="button"
              className="login-social-btn"
              disabled={mode !== "auth0"}
              title={
                mode !== "auth0"
                  ? "Configure Auth0 environment variables to enable"
                  : undefined
              }
            >
              <span className="login-social-btn__icon">G</span> Google
            </button>
            <button
              type="button"
              className="login-social-btn"
              disabled={mode !== "auth0"}
              title={
                mode !== "auth0"
                  ? "Configure Auth0 environment variables to enable"
                  : undefined
              }
            >
              {"<>"} GitHub
            </button>
          </div>

          <p className="login-card__notice">
            Unauthorized access is strictly monitored.
          </p>

          {mode === "demo" && (
            <p className="login-card__demo-badge">
              Demo mode — Auth0 not configured
            </p>
          )}
        </form>
      </main>

      <footer className="login-footer">
        <span>ActBound AI</span>
        <span className="login-footer__spacer">Zero Trust Infrastructure.</span>
        <span>Privacy Policy</span>
        <span>Terms of Service</span>
        <span>Security Audit</span>
      </footer>
    </div>
  );
}
