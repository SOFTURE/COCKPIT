// A read-only client of the forge's REST API (GitHub's shape). It reads with the token from the environment and
// never writes; failures carry a code and the status, never the token or the URL (requestJson).
import { requestJson, type FetchFunction } from "@softure-ai/core";
import { z } from "zod";

export const DEFAULT_FORGE_API_URL = "https://api.github.com";

/** The header naming the fine-grained permission a refused call needed, e.g. `contents=read`. */
export const ACCEPTED_PERMISSIONS_HEADER = "x-accepted-github-permissions";

const repositorySchema = z.object({ full_name: z.string(), default_branch: z.string() });

export type ForgeRepository = z.infer<typeof repositorySchema>;

export type ForgeReadFailure =
  | { readonly kind: "not_found" }
  | { readonly kind: "unauthorized" }
  | { readonly kind: "refused"; readonly status: number | null; readonly acceptedPermissions: string | null }
  | { readonly kind: "unavailable" };

export type ForgeRead<T> = { readonly ok: true; readonly value: T } | ({ readonly ok: false } & ForgeReadFailure);

export interface ForgeClient {
  getRepository(owner: string, name: string): Promise<ForgeRead<ForgeRepository>>;
  /** A GET whose body is not needed: answers whether the token may read the path. */
  probe(path: string): Promise<ForgeRead<undefined>>;
}

export interface ForgeClientOptions {
  readonly token: string;
  readonly baseUrl?: string;
  readonly fetch?: FetchFunction;
}

export function createForgeClient({ token, baseUrl = DEFAULT_FORGE_API_URL, fetch }: ForgeClientOptions): ForgeClient {
  const root = baseUrl.replace(/\/+$/, "");
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };

  async function read<T>(path: string, schema: z.ZodType<T>): Promise<ForgeRead<T>> {
    const result = await requestJson({
      url: `${root}${path}`,
      headers,
      schema,
      fetch,
      readHeaders: [ACCEPTED_PERMISSIONS_HEADER],
    });
    if (result.ok) {
      return { ok: true, value: result.value.body };
    }
    if (result.status === 404) {
      return { ok: false, kind: "not_found" };
    }
    if (result.status === 401) {
      return { ok: false, kind: "unauthorized" };
    }
    if (result.error === "core.http_refused") {
      const acceptedPermissions = "headers" in result ? (result.headers?.[ACCEPTED_PERMISSIONS_HEADER] ?? null) : null;
      return { ok: false, kind: "refused", status: result.status, acceptedPermissions };
    }
    return { ok: false, kind: "unavailable" };
  }

  return {
    getRepository: (owner, name) =>
      read(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`, repositorySchema),
    probe: async (path) => {
      const answer = await read(path, z.unknown());
      return answer.ok ? { ok: true, value: undefined } : answer;
    },
  };
}
