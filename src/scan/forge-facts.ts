// The scan's forge step beside the state: the latest release, the main branch's CI and quality-review runs and the
// doctor result of one project. A rate limit stops the scan (the caller retries later); any other failure keeps the last good facts.
import type { RecordForgeFactsInput, FactUpdate } from "../../modules/overview/facts.ts";
import { readDoctor } from "../doctor/read-doctor.ts";
import type { ForgeClient, ForgeRead } from "../forge/client.ts";
import { getLatestRelease } from "../forge/releases.ts";
import { findLastCiRun, findLastQualityReview, getMainBranchRuns } from "../forge/runs.ts";

export type ForgeFactsRead =
  | { readonly kind: "read"; readonly facts: Omit<RecordForgeFactsInput, "key" | "readAt"> }
  | { readonly kind: "rate_limited"; readonly retryAfterSeconds: number | null };

export interface ReadForgeFactsOptions {
  readonly client: ForgeClient;
  readonly owner: string;
  readonly name: string;
  readonly branch: string;
}

function toUpdate<T, U>(answer: ForgeRead<T>, pick: (value: T) => U): FactUpdate<U> {
  if (answer.ok) {
    return { status: "ok", value: pick(answer.value) };
  }
  return answer.kind === "refused" || answer.kind === "unauthorized" || answer.kind === "not_found"
    ? { status: "not_readable" }
    : { status: "unavailable" };
}

export async function readForgeFacts({ client, owner, name, branch }: ReadForgeFactsOptions): Promise<ForgeFactsRead> {
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
  return {
    kind: "read",
    facts: {
      doctor: doctor.doctor,
      release: toUpdate(release, (value) => value),
      runs: toUpdate(runs, (value) => ({ ci: findLastCiRun(value), qualityReview: findLastQualityReview(value) })),
    },
  };
}
