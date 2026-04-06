import type {
  AuthorizationContext,
  AuthorizationDecision,
} from "@actbound/authorization";
import type { Request } from "express";
import type { Principal } from "../domain/identity/principal";

export type RequestWithAuthContext = Request & {
  /** Normalized authenticated principal. Set by JwtAuthMiddleware. */
  principal?: Principal;
  /** Full authorization context. Set by AuthorizationContextMiddleware. */
  authContext?: AuthorizationContext;
  permissionDecision?: AuthorizationDecision;
};
