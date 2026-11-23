// The watched repositories for a screen; a failed read is a bug to surface, not an empty list.
import "server-only";
import { findRepositories, type WatchedRepository } from "../../modules/projects/queries.ts";
import { getDatabase } from "../database.ts";

export async function loadWatchedRepositories(): Promise<WatchedRepository[]> {
  const { db } = await getDatabase();
  const result = await findRepositories(db);
  if (!result.ok) {
    throw new Error(`loadWatchedRepositories: listing watched repositories failed (${result.error})`);
  }
  return result.value;
}
