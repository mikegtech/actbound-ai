import type { AuthorizationContext } from "@actbound/authorization";
import type { Request } from "express";

export type RequestWithAuthContext = Request & {
  authContext?: AuthorizationContext;
};
