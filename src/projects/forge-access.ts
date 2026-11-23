// The forge client COCKPIT runs with: the token and API base from the environment (NFR-6: the token is never logged).
import "server-only";
import { createForgeClient, DEFAULT_FORGE_API_URL, type ForgeClient } from "../forge/client.ts";

/** The configured client, or `null` while the operator has not set `FORGE_TOKEN`. */
export function getForgeClient(env: NodeJS.ProcessEnv = process.env): ForgeClient | null {
  const token = env.FORGE_TOKEN?.trim() ?? "";
  if (token === "") {
    return null;
  }
  return createForgeClient({ token, baseUrl: env.FORGE_API_URL ?? DEFAULT_FORGE_API_URL });
}
