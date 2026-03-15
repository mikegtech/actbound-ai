import type { AnyZodObject, ZodTypeAny } from "zod";

export type ApiMethod = "get" | "post";

export type ApiResponseContract = {
  description: string;
  schema: ZodTypeAny;
};

export type ApiRouteContract = {
  method: ApiMethod;
  path: string;
  summary: string;
  operationId: string;
  tags: string[];
  request?: {
    body?: ZodTypeAny;
    params?: AnyZodObject;
    query?: AnyZodObject;
  };
  responses: Record<number, ApiResponseContract>;
};
