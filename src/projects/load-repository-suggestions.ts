// The repositories Settings offers to watch: those the access token can read, minus the watched ones.
import "server-only";
import type { WatchedRepository } from "../../modules/projects/queries.ts";
import { listReadableRepositories } from "../forge/repositories.ts";
import { getForgeClient } from "./forge-access.ts";

export type RepositorySuggestions =
  | { readonly kind: "listed"; readonly names: readonly string[] }
  /** No token, or the forge did not answer the list: the owner types `owner/name`. */
  | { readonly kind: "unavailable" };

export async function loadRepositorySuggestions(watched: readonly WatchedRepository[]): Promise<RepositorySuggestions> {
  const client = getForgeClient();
  if (client === null) {
    return { kind: "unavailable" };
  }
  const answer = await listReadableRepositories(client);
  if (!answer.ok) {
    console.warn(`loadRepositorySuggestions: listing the token's repositories failed (${answer.kind})`);
    return { kind: "unavailable" };
  }
  const watchedNames = new Set(watched.map((repository) => repository.fullName.toLowerCase()));
  return { kind: "listed", names: answer.value.filter((name) => !watchedNames.has(name.toLowerCase())) };
}
