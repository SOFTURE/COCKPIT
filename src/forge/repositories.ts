// The repositories the access token can read, so Settings offers them instead of asking for `owner/name`. With a
// fine-grained token the forge lists only the repositories granted to it, which is exactly what COCKPIT can watch.
import { z } from "zod";
import type { ForgeClient, ForgeRead } from "./client.ts";

/** Repositories per page, the forge's maximum. */
const PER_PAGE = 100;
/** Pages read at most (500 repositories). */
const MAX_PAGES = 5;

const repositoriesSchema = z.array(z.object({ full_name: z.string(), archived: z.boolean().optional() }));

/** Full names of the readable, not archived repositories, sorted by name (case-insensitive). */
export async function listReadableRepositories(client: ForgeClient): Promise<ForgeRead<string[]>> {
  const names: string[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const answer = await client.getJson(`/user/repos?per_page=${String(PER_PAGE)}&sort=full_name&page=${String(page)}`, repositoriesSchema);
    if (!answer.ok) {
      return answer;
    }
    names.push(...answer.value.filter((repository) => repository.archived !== true).map((repository) => repository.full_name));
    if (answer.value.length < PER_PAGE) {
      break;
    }
  }
  return { ok: true, value: names.sort((left, right) => left.localeCompare(right, "en", { sensitivity: "base" })) };
}

/**
 * The union of every token's readable repositories (F-6), sorted like one list. A token whose list fails is left
 * out; the read fails only when every list fails, with the first failure.
 */
export async function listReadableRepositoriesOfAll(clients: readonly ForgeClient[]): Promise<ForgeRead<string[]>> {
  const answers = await Promise.all(clients.map((client) => listReadableRepositories(client)));
  const byKey = new Map<string, string>();
  let firstFailure: ForgeRead<string[]> | null = null;
  for (const answer of answers) {
    if (!answer.ok) {
      firstFailure ??= answer;
      continue;
    }
    for (const name of answer.value) {
      if (!byKey.has(name.toLowerCase())) {
        byKey.set(name.toLowerCase(), name);
      }
    }
  }
  if (firstFailure !== null && answers.every((answer) => !answer.ok)) {
    return firstFailure;
  }
  return { ok: true, value: [...byKey.values()].sort((left, right) => left.localeCompare(right, "en", { sensitivity: "base" })) };
}
