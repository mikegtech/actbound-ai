import { Controller, Get, Header } from "@nestjs/common";
import { buildOpenApiDocument, orchestratorRouteList } from "@actbound/sdk";

const openApiDocument = buildOpenApiDocument({
  title: "ActBound AI Orchestrator API",
  version: "0.1.0",
  description: "External-facing orchestration service for ActBound AI",
  routes: orchestratorRouteList,
});

@Controller("docs")
export class DocsController {
  @Get("openapi.json")
  getOpenApiDocument(): ReturnType<typeof buildOpenApiDocument> {
    return openApiDocument;
  }

  @Get()
  @Header("content-type", "text/html; charset=utf-8")
  getDocsPage() {
    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>ActBound AI Orchestrator API Docs</title>
          <style>
            body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 2rem; color: #16202a; }
            pre { background: #0f172a; color: #e2e8f0; padding: 1rem; border-radius: 12px; overflow: auto; }
          </style>
        </head>
        <body>
          <h1>ActBound AI Orchestrator API</h1>
          <p>OpenAPI JSON is available at <code>/docs/openapi.json</code>.</p>
          <pre>${JSON.stringify(openApiDocument, null, 2)}</pre>
        </body>
      </html>
    `;
  }
}
