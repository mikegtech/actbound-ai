import type {
  AuthorizationContext,
  AuthorizationDecision,
} from "@actbound/authorization";
import type { Request } from "express";

export type RequestWithAuthContext = Request & {
  authContext?: AuthorizationContext;
  permissionDecision?: AuthorizationDecision;
};
