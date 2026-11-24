// What waits for a project's next deploy (CT-2): the pull requests merged into the main branch since the newest
// release (the compare API) and the secrets its compose file requires now that it did not at the tag in production
// (the compose file at both refs). Three forge reads, all read-only; a rate limit on any of them stops the scan, any
// other failure leaves only that fact unknown.
import { z } from "zod";
import type { ForgeClient, ForgeRead } from "../../forge/client.ts";
import { getTextFile } from "../../forge/text-file.ts";
import type { AdapterProject } from "../contract.ts";
import type { DeployState } from "./deploy-state.ts";
import { countMergedPullRequests } from "./merged-changes.ts";
import { COMPOSE_FILE, getAddedNames } from "./required-secrets.ts";

export type Waiting = NonNullable<DeployState["waiting"]>;

export type WaitingRead = { readonly ok: true; readonly value: Waiting } | { readonly ok: false; readonly retryAfterSeconds: number | null };

export interface WaitingQuery {
  readonly client: ForgeClient;
  readonly project: AdapterProject;
  /** The newest published release's tag, or null. */
  readonly releaseTag: string | null;
  /** The tag running in production, or null. */
  readonly productionTag: string | null;
}

const compareSchema = z.object({
  ahead_by: z.number().int().nonnegative(),
  commits: z.array(z.object({ commit: z.object({ message: z.string() }) })),
});
type Compare = z.infer<typeof compareSchema>;

const NOT_READ: ForgeRead<never> = { ok: false, kind: "not_found" };

function readCompare(client: ForgeClient, project: AdapterProject, tag: string): Promise<ForgeRead<Compare>> {
  const base = `/repos/${encodeURIComponent(project.owner)}/${encodeURIComponent(project.name)}`;
  return client.getJson(`${base}/compare/${encodeURIComponent(tag)}...${encodeURIComponent(project.branch)}`, compareSchema);
}

function readCompose(client: ForgeClient, project: AdapterProject, ref: string): Promise<ForgeRead<string>> {
  return getTextFile(client, { owner: project.owner, name: project.name, path: COMPOSE_FILE, ref });
}

function toMerged(compare: ForgeRead<Compare>): Waiting["merged"] {
  if (!compare.ok) {
    return null;
  }
  const { ahead_by: aheadBy, commits } = compare.value;
  return { count: countMergedPullRequests(commits.map((entry) => entry.commit.message)), isLowerBound: commits.length < aheadBy };
}

function toSecrets(since: string | null, deployed: ForgeRead<string>, current: ForgeRead<string>): Waiting["secrets"] {
  if (since === null || !deployed.ok || !current.ok) {
    return null;
  }
  return { since, added: getAddedNames(deployed.value, current.value) };
}

export async function readWaiting({ client, project, releaseTag, productionTag }: WaitingQuery): Promise<WaitingRead> {
  const [compare, current, deployed] = await Promise.all([
    releaseTag === null ? NOT_READ : readCompare(client, project, releaseTag),
    productionTag === null ? NOT_READ : readCompose(client, project, project.branch),
    productionTag === null ? NOT_READ : readCompose(client, project, productionTag),
  ]);
  for (const answer of [compare, current, deployed]) {
    if (!answer.ok && answer.kind === "rate_limited") {
      return { ok: false, retryAfterSeconds: answer.retryAfterSeconds };
    }
  }
  return {
    ok: true,
    value: { release: releaseTag, merged: toMerged(compare), secrets: toSecrets(productionTag, deployed, current) },
  };
}
