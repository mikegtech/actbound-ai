import type { ZodTypeAny } from "zod";

import { StandardApiErrorSchema } from "../schemas";

type Infer<TSchema extends ZodTypeAny> = import("zod").infer<TSchema>;

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly payload: Infer<typeof StandardApiErrorSchema>,
  ) {
    super(payload.message);
  }
}

export class ApiClientBase {
  constructor(
    protected readonly baseUrl: string,
    protected readonly defaultInit: RequestInit = {},
  ) {}

  protected async get<TSchema extends ZodTypeAny>(
    path: string,
    responseSchema: TSchema,
  ): Promise<Infer<TSchema>> {
    return this.request("GET", path, responseSchema);
  }

  protected async post<
    TRequestSchema extends ZodTypeAny,
    TResponseSchema extends ZodTypeAny,
  >(
    path: string,
    requestSchema: TRequestSchema,
    payload: unknown,
    responseSchema: TResponseSchema,
  ): Promise<Infer<TResponseSchema>> {
    const body = requestSchema.parse(payload);

    return this.request("POST", path, responseSchema, {
      body: JSON.stringify(body),
    });
  }

  private async request<TSchema extends ZodTypeAny>(
    method: string,
    path: string,
    responseSchema: TSchema,
    init: RequestInit = {},
  ): Promise<Infer<TSchema>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...this.defaultInit,
      ...init,
      method,
      headers: {
        "content-type": "application/json",
        ...(this.defaultInit.headers ?? {}),
        ...(init.headers ?? {}),
      },
    });

    const payload = await response.json().catch(() => undefined);

    if (!response.ok) {
      throw new ApiClientError(
        response.status,
        StandardApiErrorSchema.parse(
          payload ?? {
            code: "unexpected_error",
            message: `${method} ${path} failed.`,
          },
        ),
      );
    }

    return responseSchema.parse(payload);
  }
}
