import { OpenFgaClient } from "@openfga/sdk";
import type { OpenFGAConfig } from "./config";

/**
 * Creates an OpenFGA SDK client from our config.
 * Thin wrapper — keeps the SDK import in one place.
 */
export function createFgaClient(config: OpenFGAConfig): OpenFgaClient {
  return new OpenFgaClient({
    apiUrl: config.apiUrl,
    storeId: config.storeId,
    authorizationModelId: config.authorizationModelId,
  });
}

export type { OpenFgaClient };
