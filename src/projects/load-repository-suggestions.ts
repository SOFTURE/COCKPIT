// The repositories Settings offers to watch: those the access token can read, minus the watched ones. The list comes
// from one cache per server process (see repository-list-cache.ts), so a visit does not wait for the forge.
import "server-only";
import { systemClock } from "@softure-ai/core";
import type { WatchedRepository } from "../../modules/projects/queries.ts";
import { listReadableRepositories } from "../forge/repositories.ts";
import { getForgeClient } from "./forge-access.ts";
import { createRepositoryListCache, type RepositoryList, type RepositoryListCache } from "./repository-list-cache.ts";

/** How long the token's repository list is served before a background read refreshes it. */
export const REPOSITORY_LIST_FRESH_MS = 5 * 60_000;

export type RepositorySuggestions =
  | { readonly kind: "listed"; readonly names: readonly string[]; readonly readAt: Date }
  /** The list is still being read (the streamed page's first paint): typing `owner/name` already works. */
  | { readonly kind: "loading" }
  /** No token, or the forge did not answer the list: the owner types `owner/name`. */
  | { readonly kind: "unavailable" };

let cache: RepositoryListCache | null = null;

function getCache(): RepositoryListCache | null {
  const client = getForgeClient();
  if (client === null) {
    return null;
  }
  cache ??= createRepositoryListCache({
    // The client is built per read, so a changed FORGE_TOKEN is used from the next read on.
    list: () => {
      const current = getForgeClient();
      return current === null ? Promise.resolve({ ok: false, kind: "unauthorized" }) : listReadableRepositories(current);
    },
    clock: systemClock,
    freshMs: REPOSITORY_LIST_FRESH_MS,
    onFailure: (kind) => {
      console.warn(`loadRepositorySuggestions: listing the token's repositories failed (${kind})`);
    },
  });
  return cache;
}

function toSuggestions(list: RepositoryList | null, watched: readonly WatchedRepository[]): RepositorySuggestions {
  if (list === null) {
    return { kind: "unavailable" };
  }
  const watchedNames = new Set(watched.map((repository) => repository.fullName.toLowerCase()));
  return { kind: "listed", names: list.names.filter((name) => !watchedNames.has(name.toLowerCase())), readAt: list.readAt };
}

export async function loadRepositorySuggestions(watched: readonly WatchedRepository[]): Promise<RepositorySuggestions> {
  const current = getCache();
  return current === null ? { kind: "unavailable" } : toSuggestions(await current.read(), watched);
}

/** Rereads the token's repository list now (the refresh on Settings). */
export async function refreshRepositorySuggestions(): Promise<void> {
  await getCache()?.refresh();
}
