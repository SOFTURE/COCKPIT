// A watched project's history for the signed-in owner, read from the forge when the page opens.
import "server-only";
import { connection } from "next/server";
import type { WatchedRepository } from "../../../modules/projects/queries.ts";
import { parseRepositoryName } from "../../forge/repository-name.ts";
import { getForgeClient } from "../../projects/forge-access.ts";
import { buildUnconfiguredHistory, type ProjectHistory } from "./build-history.ts";
import { readHistory } from "./read-history.ts";

export async function loadHistory(repository: WatchedRepository): Promise<ProjectHistory> {
  // Request-time data: never read while the build prerenders.
  await connection();
  const client = getForgeClient();
  const parsed = parseRepositoryName(repository.fullName);
  if (client === null || !parsed.ok) {
    return buildUnconfiguredHistory();
  }
  return readHistory({ client, owner: parsed.value.owner, name: parsed.value.name, branch: repository.defaultBranch });
}
