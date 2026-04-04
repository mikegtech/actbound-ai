/**
 * OpenFGA connection configuration.
 * All values come from environment variables. No hardcoded credentials.
 */
export interface OpenFGAConfig {
  apiUrl: string;
  storeId: string;
  authorizationModelId?: string;
}

export function loadConfig(): OpenFGAConfig {
  const apiUrl = process.env.OPENFGA_API_URL ?? "http://localhost:8080";
  const storeId = process.env.OPENFGA_STORE_ID ?? "";

  if (!storeId) {
    throw new Error(
      "OPENFGA_STORE_ID is required. Set it in your environment or .env file.",
    );
  }

  return {
    apiUrl,
    storeId,
    authorizationModelId: process.env.OPENFGA_MODEL_ID || undefined,
  };
}

/**
 * Lenient config loader for scripts that create the store.
 * Does not require OPENFGA_STORE_ID.
 */
export function loadScriptConfig(): Omit<OpenFGAConfig, "storeId"> & {
  storeId: string | undefined;
} {
  return {
    apiUrl: process.env.OPENFGA_API_URL ?? "http://localhost:8080",
    storeId: process.env.OPENFGA_STORE_ID || undefined,
    authorizationModelId: process.env.OPENFGA_MODEL_ID || undefined,
  };
}
