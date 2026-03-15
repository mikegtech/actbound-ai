import {
  OpenApiGeneratorV3,
  OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";

import type { ApiRouteContract } from "../contracts/types";

type BuildOpenApiDocumentOptions = {
  title: string;
  version: string;
  description: string;
  routes: ApiRouteContract[];
};

export function buildOpenApiDocument({
  title,
  version,
  description,
  routes,
}: BuildOpenApiDocumentOptions): ReturnType<
  OpenApiGeneratorV3["generateDocument"]
> {
  const registry = new OpenAPIRegistry();

  for (const route of routes) {
    const responses = Object.fromEntries(
      Object.entries(route.responses).map(([statusCode, response]) => [
        statusCode,
        {
          description: response.description,
          content: {
            "application/json": {
              schema: response.schema,
            },
          },
        },
      ]),
    );

    const request =
      route.request?.body || route.request?.params || route.request?.query
        ? {
            body: route.request?.body
              ? {
                  content: {
                    "application/json": {
                      schema: route.request.body,
                    },
                  },
                }
              : undefined,
            params: route.request?.params,
            query: route.request?.query,
          }
        : undefined;

    registry.registerPath({
      method: route.method,
      path: route.path,
      operationId: route.operationId,
      summary: route.summary,
      tags: route.tags,
      request,
      responses,
    });
  }

  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title,
      version,
      description,
    },
  });
}
