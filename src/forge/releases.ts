// The latest published release of a repository (GitHub's `releases/latest`); a repository without one answers 404,
// which is "no release", not a failure. Also the newest published releases, for a project's history (FR-11).
import { z } from "zod";
import type { ForgeClient, ForgeRead } from "./client.ts";

const latestReleaseSchema = z.object({ tag_name: z.string(), published_at: z.string().nullable() });

export interface ForgeRelease {
  readonly version: string;
  /** `YYYY-MM-DD` of publication; null for a release the forge gave no date. */
  readonly date: string | null;
}

export async function getLatestRelease(client: ForgeClient, owner: string, name: string): Promise<ForgeRead<ForgeRelease | null>> {
  const answer = await client.getJson(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/releases/latest`,
    latestReleaseSchema,
  );
  if (!answer.ok) {
    return answer.kind === "not_found" ? { ok: true, value: null } : answer;
  }
  if (answer.value.tag_name === "") {
    return { ok: true, value: null };
  }
  return { ok: true, value: { version: answer.value.tag_name, date: answer.value.published_at?.slice(0, 10) ?? null } };
}

/** Releases shown in a project's history at most. */
export const RELEASES_SHOWN = 5;
/** Releases read to find them: drafts are listed too and dropped. */
const RELEASES_READ = 10;

const releaseSchema = z.object({
  tag_name: z.string(),
  name: z.string().nullable().optional(),
  html_url: z.string(),
  published_at: z.string().nullable().optional(),
  draft: z.boolean().optional(),
  prerelease: z.boolean().optional(),
});

export interface ForgeReleaseEntry {
  readonly version: string;
  /** The release's title when it has one other than its tag. */
  readonly title: string | null;
  readonly url: string;
  readonly publishedAt: string;
  readonly isPrerelease: boolean;
}

/** The newest published releases, newest first; drafts are not published and are left out. */
export async function getLatestReleases(client: ForgeClient, owner: string, name: string): Promise<ForgeRead<ForgeReleaseEntry[]>> {
  const answer = await client.getJson(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/releases?per_page=${String(RELEASES_READ)}`,
    z.array(releaseSchema),
  );
  if (!answer.ok) {
    return answer;
  }
  const releases: ForgeReleaseEntry[] = [];
  for (const release of answer.value) {
    if (release.draft === true || typeof release.published_at !== "string" || release.published_at === "") {
      continue;
    }
    const title = release.name?.trim() ?? "";
    releases.push({
      version: release.tag_name,
      title: title === "" || title === release.tag_name ? null : title,
      url: release.html_url,
      publishedAt: release.published_at,
      isPrerelease: release.prerelease === true,
    });
  }
  releases.sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
  return { ok: true, value: releases.slice(0, RELEASES_SHOWN) };
}
