// The scan's forge step beside the state: the latest release, the main branch's CI and quality-review runs and the
// doctor result of one project. A project whose main branch has no CI run (its checks run on pull requests only) gets
// the CI of its last merged pull request instead, labelled with that pull request (CT-7). A rate limit stops the scan (the caller retries later); any other failure keeps the last good facts.
import type { RecordForgeFactsInput, FactUpdate } from "../../modules/overview/facts.ts";
import { readDoctor } from "../doctor/read-doctor.ts";
import type { ForgeClient, ForgeRead } from "../forge/client.ts";
import { getLatestMerges } from "../forge/merges.ts";
import { getLatestRelease } from "../forge/releases.ts";
import { findLastCiRun, findLastQualityReview, getHeadRuns, getMainBranchRuns, summarizePullRequestCi, type RunSummary, type WorkflowRun } from "../forge/runs.ts";

export type ForgeFactsRead =
  | { readonly kind: "read"; readonly facts: Omit<RecordForgeFactsInput, "key" | "readAt"> }
  | { readonly kind: "rate_limited"; readonly retryAfterSeconds: number | null };

export interface ReadForgeFactsOptions {
  readonly client: ForgeClient;
  readonly owner: string;
  readonly name: string;
  readonly branch: string;
}

/** The pull request a CI result was read from. */
export interface CiPullRequest {
  readonly number: number;
  readonly url: string;
}

/** A CI result as stored: from the main branch (`pullRequest` null) or from the last merged pull request. */
export type StoredCi = RunSummary & { readonly pullRequest: CiPullRequest | null };

type CiRead = { readonly kind: "read"; readonly ci: StoredCi | null } | { readonly kind: "rate_limited"; readonly retryAfterSeconds: number | null };

/** The CI of the last merged pull request's head; null when there is none or it could not be read. */
async function readLastMergedCi({ client, owner, name, branch }: ReadForgeFactsOptions): Promise<CiRead> {
  const merges = await getLatestMerges(client, owner, name, branch);
  if (!merges.ok) {
    return merges.kind === "rate_limited" ? { kind: "rate_limited", retryAfterSeconds: merges.retryAfterSeconds } : { kind: "read", ci: null };
  }
  const merge = merges.value[0];
  if (merge === undefined || merge.headSha === null) {
    return { kind: "read", ci: null };
  }
  const runs = await getHeadRuns(client, { owner, name, sha: merge.headSha });
  if (!runs.ok) {
    return runs.kind === "rate_limited" ? { kind: "rate_limited", retryAfterSeconds: runs.retryAfterSeconds } : { kind: "read", ci: null };
  }
  const summary = summarizePullRequestCi(runs.value);
  return { kind: "read", ci: summary === null ? null : { ...summary, pullRequest: { number: merge.number, url: merge.url } } };
}

/** The main branch's CI when it has one, else the last merged pull request's. */
async function readCi(options: ReadForgeFactsOptions, runs: readonly WorkflowRun[]): Promise<CiRead> {
  const main = findLastCiRun(runs);
  return main === null ? readLastMergedCi(options) : { kind: "read", ci: { ...main, pullRequest: null } };
}

function toUpdate<T, U>(answer: ForgeRead<T>, pick: (value: T) => U): FactUpdate<U> {
  if (answer.ok) {
    return { status: "ok", value: pick(answer.value) };
  }
  return answer.kind === "refused" || answer.kind === "unauthorized" || answer.kind === "not_found"
    ? { status: "not_readable" }
    : { status: "unavailable" };
}

export async function readForgeFacts(options: ReadForgeFactsOptions): Promise<ForgeFactsRead> {
  const { client, owner, name, branch } = options;
  const release = await getLatestRelease(client, owner, name);
  if (!release.ok && release.kind === "rate_limited") {
    return { kind: "rate_limited", retryAfterSeconds: release.retryAfterSeconds };
  }
  const runs = await getMainBranchRuns(client, owner, name, branch);
  if (!runs.ok && runs.kind === "rate_limited") {
    return { kind: "rate_limited", retryAfterSeconds: runs.retryAfterSeconds };
  }
  const doctor = await readDoctor({ client, owner, name, branch, runs });
  if (doctor.kind === "rate_limited") {
    return doctor;
  }
  const ci = runs.ok ? await readCi(options, runs.value) : null;
  if (ci?.kind === "rate_limited") {
    return ci;
  }
  return {
    kind: "read",
    facts: {
      doctor: doctor.doctor,
      release: toUpdate(release, (value) => value),
      runs: toUpdate(runs, (value) => ({ ci: ci?.ci ?? null, qualityReview: findLastQualityReview(value) })),
    },
  };
}
