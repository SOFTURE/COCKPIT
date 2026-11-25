// A watched project's roadmap for the signed-in owner: the target from the scan's last good state, the file read from
// the forge when the page opens (like the history page; the scan is unchanged, NFR-2), parsed into the view.
import "server-only";
import { connection } from "next/server";
import type { WatchedRepository } from "../../modules/projects/queries.ts";
import { findReads } from "../../modules/projects/reads.ts";
import { getDatabase } from "../database.ts";
import { DEFAULT_FORGE_API_URL } from "../forge/client.ts";
import { parseRepositoryName } from "../forge/repository-name.ts";
import { getTextFile } from "../forge/text-file.ts";
import { createRepositoryLinks, getForgeWebUrl } from "../forge/web-url.ts";
import { parseStoredState } from "../project-page/build-project-page.ts";
import { getForgeClient } from "../projects/forge-access.ts";
import type { ForgeClient } from "../forge/client.ts";
import { buildRoadmapView, findRoadmapTarget, isReadableRoadmapPath, type RoadmapView } from "./build-roadmap-view.ts";
import { findOpenPromotions, type OpenPromotion } from "./promote-roadmap.ts";

export interface LoadedRoadmapView {
  readonly view: RoadmapView;
  /** The roadmap file on the forge. */
  readonly fileLink: string;
  /** The project's open promotion issues of this roadmap (a queued one only); none when they cannot be read. */
  readonly promotions: readonly OpenPromotion[];
}

async function readPromotions(client: ForgeClient | null, owner: string, name: string, slug: string): Promise<OpenPromotion[]> {
  if (client === null) {
    return [];
  }
  const issues = await client.listCockpitIssues(owner, name);
  // The controls still work without the list: a promotion finds its open issue before creating one.
  return issues.ok ? findOpenPromotions(issues.value).filter((promotion) => promotion.marker.roadmap === slug) : [];
}

export async function loadRoadmapView(repository: WatchedRepository, slug: string): Promise<LoadedRoadmapView | null> {
  // Request-time data: never read while the build prerenders.
  await connection();
  const { db } = await getDatabase();
  const reads = await findReads(db);
  if (!reads.ok) {
    throw new Error(`loadRoadmapView: reading the scan reads for ${repository.fullName} failed (${reads.error})`);
  }
  const state = parseStoredState(reads.value.find((read) => read.key === repository.key));
  const target = state === null ? null : findRoadmapTarget(state, slug);
  if (state === null || target === null) {
    return null;
  }
  const branch = state.main_branch ?? repository.defaultBranch;
  const links = createRepositoryLinks(getForgeWebUrl(process.env.FORGE_API_URL ?? DEFAULT_FORGE_API_URL), repository.fullName, branch);
  const client = getForgeClient();
  const parsed = parseRepositoryName(repository.fullName);
  if (!isReadableRoadmapPath(target.path)) {
    return { view: { ...buildRoadmapView({ target, file: null }), fallback: "unsafe_path" }, fileLink: links.repository, promotions: [] };
  }
  const [file, promotions] = !parsed.ok
    ? [null, []]
    : await Promise.all([
        client === null ? null : getTextFile(client, { owner: parsed.value.owner, name: parsed.value.name, path: target.path, ref: branch }),
        target.kind === "queued" ? readPromotions(client, parsed.value.owner, parsed.value.name, target.slug) : [],
      ]);
  return { view: buildRoadmapView({ target, file }), fileLink: links.file(target.path), promotions };
}
