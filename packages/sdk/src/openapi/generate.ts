import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { agentRouteList } from "../contracts/agent";
import { orchestratorRouteList } from "../contracts/orchestrator";
import { buildOpenApiDocument } from "./registry";

const outputDir = resolve(__dirname, "../../../../docs/openapi");

mkdirSync(outputDir, { recursive: true });

const orchestratorDocument = buildOpenApiDocument({
  title: "ActBound AI Orchestrator API",
  version: "0.1.0",
  description: "External orchestration service contract",
  routes: orchestratorRouteList,
});

const agentDocument = buildOpenApiDocument({
  title: "ActBound AI Agent Service",
  version: "0.1.0",
  description: "Internal agent domain service contract",
  routes: agentRouteList,
});

writeFileSync(
  resolve(outputDir, "orchestrator-api.json"),
  `${JSON.stringify(orchestratorDocument, null, 2)}\n`,
);
writeFileSync(
  resolve(outputDir, "agent-service.json"),
  `${JSON.stringify(agentDocument, null, 2)}\n`,
);
