/**
 * seed-tuples.ts — Writes example tuples from tuples.yaml to OpenFGA.
 *
 * Usage:
 *   OPENFGA_API_URL=http://localhost:8080 \
 *   OPENFGA_STORE_ID=<id> \
 *   OPENFGA_MODEL_ID=<id> \
 *   pnpm --filter @actbound/openfga seed-tuples
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import { loadConfig, createFgaClient } from "../client";

interface TupleEntry {
  user: string;
  relation: string;
  object: string;
}

interface TuplesFile {
  tuples: TupleEntry[];
}

async function main() {
  const config = loadConfig();
  const client = createFgaClient(config);

  const tuplesPath = resolve(__dirname, "../../model/tuples.yaml");
  const raw = readFileSync(tuplesPath, "utf-8");
  const data = parseYaml(raw) as TuplesFile;

  console.log(
    `[seed-tuples] Writing ${data.tuples.length} tuples to store ${config.storeId}`,
  );

  // Write tuples in batch (OpenFGA supports up to 100 per call)
  await client.write(
    {
      writes: data.tuples.map((t) => ({
        user: t.user,
        relation: t.relation,
        object: t.object,
      })),
    },
    {
      authorizationModelId: config.authorizationModelId,
    },
  );

  console.log(`[seed-tuples] ${data.tuples.length} tuples written.`);

  // Verify with a sample check
  const checkResult = await client.check(
    {
      user: "user:alice",
      relation: "admin",
      object: "organization:acme",
    },
    {
      authorizationModelId: config.authorizationModelId,
    },
  );

  console.log(
    `[seed-tuples] Verification: user:alice admin organization:acme = ${checkResult.allowed}`,
  );
}

main().catch((err) => {
  console.error("[seed-tuples] Failed:", err);
  process.exit(1);
});
