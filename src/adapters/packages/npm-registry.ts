// The newest published version of a package on the npm registry (CT-1): `GET <registry>/-/package/<name>/dist-tags`,
// a few bytes instead of the whole package document. Public data, no token. The registry comes from
// `NPM_REGISTRY_URL` (default the public registry); each package is asked once per scan, and once the registry could
// not be reached the rest of the scan reads "unknown" at once instead of waiting per package (NFR-2).
import { requestJson, type FetchFunction } from "@softure-ai/core";
import { createLogger } from "@softure-ai/observability";
import { z } from "zod";

const logger = createLogger("packages");

export const DEFAULT_NPM_REGISTRY_URL = "https://registry.npmjs.org";

/** Milliseconds one registry answer may take. */
const TIMEOUT_MS = 5_000;

const distTagsSchema = z.object({ latest: z.string().min(1).max(64) }).loose();

export interface NpmRegistry {
  /** The `latest` version; null when the registry did not answer it. */
  getLatestVersion(name: string): Promise<string | null>;
}

export function getNpmRegistryUrl(env: Readonly<Record<string, string | undefined>>): string {
  const url = env.NPM_REGISTRY_URL?.trim() ?? "";
  return url === "" ? DEFAULT_NPM_REGISTRY_URL : url;
}

/** One registry per scan run: answers are cached for the run, failures included. */
export function createNpmRegistry(baseUrl: string, fetch: FetchFunction = globalThis.fetch): NpmRegistry {
  const root = baseUrl.replace(/\/+$/, "");
  const cache = new Map<string, Promise<string | null>>();
  let isUnreachable = false;

  async function ask(name: string): Promise<string | null> {
    if (isUnreachable) {
      return null;
    }
    const answer = await requestJson({ url: `${root}/-/package/${encodeURIComponent(name).replace(/^%40/, "@")}/dist-tags`, schema: distTagsSchema, fetch, timeoutMs: TIMEOUT_MS });
    if (answer.ok) {
      return answer.value.latest;
    }
    if (answer.error === "core.http_unreachable") {
      isUnreachable = true;
    }
    logger.warn("reading the newest version from the npm registry failed", { package: name, code: answer.error });
    return null;
  }

  return {
    getLatestVersion: (name) => {
      const cached = cache.get(name);
      if (cached !== undefined) {
        return cached;
      }
      const pending = ask(name);
      cache.set(name, pending);
      return pending;
    },
  };
}
