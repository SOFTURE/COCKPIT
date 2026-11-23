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
