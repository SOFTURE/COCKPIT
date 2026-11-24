// The latest merges into a repository's main branch: its merged pull requests, newest merge first (FR-11).
import { z } from "zod";
import type { ForgeClient, ForgeRead } from "./client.ts";

/** Merges shown at most. */
export const MERGES_SHOWN = 10;
/** Closed pull requests read to find them: one page, most recently updated first. */
export const CLOSED_PULLS_READ = 50;

const pullSchema = z.object({
  number: z.number().int(),
  title: z.string(),
  html_url: z.string(),
  merged_at: z.string().nullable().optional(),
  merge_commit_sha: z.string().nullable().optional(),
  user: z.object({ login: z.string() }).nullable().optional(),
  head: z.object({ sha: z.string() }).nullable().optional(),
});

export interface ForgeMerge {
  readonly number: number;
  readonly title: string;
  readonly url: string;
  readonly mergedAt: string;
  /** Who opened the pull request; null when the forge does not say. */
  readonly author: string | null;
  /** The pull request's head commit, where its checks ran; null when the forge does not say. */
  readonly headSha: string | null;
}

export async function getLatestMerges(client: ForgeClient, owner: string, name: string, branch: string): Promise<ForgeRead<ForgeMerge[]>> {
  const path =
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/pulls` +
    `?state=closed&base=${encodeURIComponent(branch)}&sort=updated&direction=desc&per_page=${String(CLOSED_PULLS_READ)}`;
  const answer = await client.getJson(path, z.array(pullSchema));
  if (!answer.ok) {
    return answer;
  }
  const merges: ForgeMerge[] = [];
  for (const pull of answer.value) {
    // A closed pull request without a merge time was closed unmerged.
    if (typeof pull.merged_at === "string" && pull.merged_at !== "") {
      merges.push({ number: pull.number, title: pull.title, url: pull.html_url, mergedAt: pull.merged_at, author: pull.user?.login ?? null, headSha: pull.head?.sha ?? null });
    }
  }
  merges.sort((left, right) => right.mergedAt.localeCompare(left.mergedAt));
  return { ok: true, value: merges.slice(0, MERGES_SHOWN) };
}
