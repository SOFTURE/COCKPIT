// The forge client COCKPIT runs with: the tokens and API base from the environment (NFR-6: a token is never logged).
// `FORGE_TOKEN` is the first token; the optional `FORGE_EXTRA_TOKENS` adds one fine-grained token per further
// resource owner (F-6), and each repository is read with the first token that can read it (token-router.ts).
import "server-only";
import { createForgeClient, DEFAULT_FORGE_API_URL, type ForgeClient } from "../forge/client.ts";
import { createTokenRouter } from "../forge/token-router.ts";

/** The environment names the forge access reads. */
export type ForgeEnvironment = Readonly<Record<string, string | undefined>>;

/** `FORGE_TOKEN`, then every token in `FORGE_EXTRA_TOKENS` (comma or whitespace separated), each once. */
export function readForgeTokens(env: ForgeEnvironment): string[] {
  const primary = env.FORGE_TOKEN?.trim() ?? "";
  if (primary === "") {
    return [];
  }
  const extra = (env.FORGE_EXTRA_TOKENS ?? "").split(/[\s,]+/).filter((token) => token !== "");
  return [...new Set([primary, ...extra])];
}

/** One client per configured token, `FORGE_TOKEN`'s first; empty while the operator has not set `FORGE_TOKEN`. */
export function getForgeClients(env: ForgeEnvironment = process.env): ForgeClient[] {
  const baseUrl = env.FORGE_API_URL ?? DEFAULT_FORGE_API_URL;
  return readForgeTokens(env).map((token) => createForgeClient({ token, baseUrl }));
}

/** The configured client, routing each repository to a token that reads it, or `null` without `FORGE_TOKEN`. */
export function getForgeClient(env: ForgeEnvironment = process.env): ForgeClient | null {
  const clients = getForgeClients(env);
  return clients.length === 0 ? null : createTokenRouter(clients);
}
