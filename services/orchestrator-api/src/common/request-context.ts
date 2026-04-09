import type {
  AuthorizationContext,
  AuthorizationDecision,
} from "@actbound/authorization";
import type { Request } from "express";
import type { NormalizedPrincipal } from "../domain/identity/normalized-principal";

export type RequestWithAuthContext = Request & {
  /** Normalized authenticated principal. Set by JwtAuthMiddleware. */
  principal?: NormalizedPrincipal;
  /** Full authorization context. Set by AuthorizationContextMiddleware. */
  authContext?: AuthorizationContext;
  permissionDecision?: AuthorizationDecision;
};
