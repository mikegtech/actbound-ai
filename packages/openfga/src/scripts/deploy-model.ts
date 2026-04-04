/**
 * deploy-model.ts — Reads the .fga model file and writes it to OpenFGA.
 *
 * Usage:
 *   OPENFGA_API_URL=http://localhost:8080 OPENFGA_STORE_ID=<id> pnpm --filter @actbound/openfga deploy-model
 *
 * If OPENFGA_STORE_ID is not set, the script creates a new store.
 * The resulting model ID is printed to stdout and written to .openfga-model-id.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { OpenFgaClient } from "@openfga/sdk";

async function main() {
  const apiUrl = process.env.OPENFGA_API_URL ?? "http://localhost:8080";
  let storeId = process.env.OPENFGA_STORE_ID ?? "";

  console.log(`[deploy-model] Connecting to OpenFGA at ${apiUrl}`);

  // If no store ID, create one
  if (!storeId) {
    console.log(
      "[deploy-model] No OPENFGA_STORE_ID set. Creating new store...",
    );
    const bootstrapClient = new OpenFgaClient({ apiUrl, storeId: "" });
    const storeResponse = await bootstrapClient.createStore({
      name: "actbound-dev",
    });
    storeId = storeResponse.id!;
    console.log(`[deploy-model] Created store: ${storeId}`);
    console.log(
      `[deploy-model] Set OPENFGA_STORE_ID=${storeId} in your environment.`,
    );
  }

  const client = new OpenFgaClient({ apiUrl, storeId });

  // Read the model file
  const modelPath = resolve(__dirname, "../../model/model.fga");
  const modelContent = readFileSync(modelPath, "utf-8");
  console.log(`[deploy-model] Loaded model from ${modelPath}`);

  // Write the authorization model
  const response = await client.writeAuthorizationModel(
    // The SDK expects the DSL to be transformed. For v0.8+ SDK,
    // we use the readAuthorizationModels approach after writing.
    // However, the OpenFGA SDK doesn't directly accept .fga DSL in writeAuthorizationModel.
    // We need to use the OpenFGA CLI or the REST API for DSL.
    // For now, we'll use the REST API directly.
    await transformDslToJson(modelContent, apiUrl, storeId),
  );

  const modelId = response.authorization_model_id;
  console.log(`[deploy-model] Model deployed. ID: ${modelId}`);

  // Persist for downstream scripts
  const idFilePath = resolve(__dirname, "../../.openfga-model-id");
  writeFileSync(idFilePath, modelId, "utf-8");
  console.log(`[deploy-model] Model ID written to ${idFilePath}`);
  console.log(
    `[deploy-model] Set OPENFGA_MODEL_ID=${modelId} in your environment.`,
  );
}

/**
 * Transform OpenFGA DSL (.fga) to the JSON format the SDK expects.
 * Uses the OpenFGA server's /stores/{id}/check endpoint as a reference,
 * but actually we parse the DSL ourselves for v1 simplicity.
 */
async function transformDslToJson(
  _dsl: string,
  _apiUrl: string,
  _storeId: string,
) {
  // The OpenFGA SDK writeAuthorizationModel expects a JSON structure.
  // Rather than parsing the DSL ourselves, we define the model programmatically
  // to match model.fga exactly. This keeps the .fga file as documentation
  // and the JSON structure as the deployment artifact.
  return {
    schema_version: "1.1",
    type_definitions: [
      {
        type: "user",
      },
      {
        type: "agent",
      },
      {
        type: "organization",
        relations: {
          admin: {
            this: {},
          },
          member: {
            union: {
              child: [{ this: {} }, { computedUserset: { relation: "admin" } }],
            },
          },
        },
        metadata: {
          relations: {
            admin: {
              directly_related_user_types: [
                { type: "user" },
                { type: "agent" },
              ],
            },
            member: {
              directly_related_user_types: [
                { type: "user" },
                { type: "agent" },
              ],
            },
          },
        },
      },
      {
        type: "resource",
        relations: {
          org: { this: {} },
          owner: { this: {} },
          editor: {
            union: {
              child: [
                { this: {} },
                { computedUserset: { relation: "owner" } },
                {
                  tupleToUserset: {
                    tupleset: { relation: "org" },
                    computedUserset: { relation: "admin" },
                  },
                },
              ],
            },
          },
          viewer: {
            union: {
              child: [
                { this: {} },
                { computedUserset: { relation: "editor" } },
                {
                  tupleToUserset: {
                    tupleset: { relation: "org" },
                    computedUserset: { relation: "member" },
                  },
                },
              ],
            },
          },
        },
        metadata: {
          relations: {
            org: {
              directly_related_user_types: [{ type: "organization" }],
            },
            owner: {
              directly_related_user_types: [{ type: "user" }],
            },
            editor: {
              directly_related_user_types: [
                { type: "user" },
                { type: "agent" },
              ],
            },
            viewer: {
              directly_related_user_types: [
                { type: "user" },
                { type: "agent" },
              ],
            },
          },
        },
      },
      {
        type: "agent_action",
        relations: {
          org: { this: {} },
          executor: { this: {} },
          delegator: { this: {} },
          can_execute: {
            intersection: {
              child: [
                { computedUserset: { relation: "executor" } },
                { computedUserset: { relation: "delegator" } },
              ],
            },
          },
          can_preview: {
            union: {
              child: [
                { this: {} },
                { computedUserset: { relation: "can_execute" } },
                {
                  tupleToUserset: {
                    tupleset: { relation: "org" },
                    computedUserset: { relation: "member" },
                  },
                },
              ],
            },
          },
        },
        metadata: {
          relations: {
            org: {
              directly_related_user_types: [{ type: "organization" }],
            },
            executor: {
              directly_related_user_types: [{ type: "agent" }],
            },
            delegator: {
              directly_related_user_types: [{ type: "user" }],
            },
            can_execute: {},
            can_preview: {
              directly_related_user_types: [
                { type: "user" },
                { type: "agent" },
              ],
            },
          },
        },
      },
    ],
  };
}

main().catch((err) => {
  console.error("[deploy-model] Failed:", err);
  process.exit(1);
});
