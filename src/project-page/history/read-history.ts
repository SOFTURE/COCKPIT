// The forge reads behind a project's history (FR-11), made when the owner opens it, in parallel: merges, releases,
// the main branch's workflow runs and the `context-doctor` check run with its annotations. Only reads (NFR-7); the
// scan does none of them, so its cost stays within NFR-2.
import { DOCTOR_CHECK_NAME, findNewestDoctorRun, toDoctorResult } from "../../doctor/read-doctor.ts";
import type { ForgeClient, ForgeRead } from "../../forge/client.ts";
import { getLatestMerges } from "../../forge/merges.ts";
import { getLatestReleases } from "../../forge/releases.ts";
import { getCheckRunAnnotations, getCheckRuns, getMainBranchRuns } from "../../forge/runs.ts";
import { buildHistory, type DoctorAnswer, type ProjectHistory } from "./build-history.ts";

export interface ReadHistoryOptions {
  readonly client: ForgeClient;
  readonly owner: string;
  readonly name: string;
  readonly branch: string;
}

async function readDoctorAnswer({ client, owner, name, branch }: ReadHistoryOptions): Promise<ForgeRead<DoctorAnswer>> {
  const checks = await getCheckRuns(client, { owner, name, ref: branch, checkName: DOCTOR_CHECK_NAME });
  if (!checks.ok) {
    return checks;
  }
  const run = findNewestDoctorRun(checks.value);
  if (run === null || toDoctorResult(run, null).kind !== "failing" || run.annotationsCount === 0) {
    return { ok: true, value: { run } };
  }
  return { ok: true, value: { run, annotations: await getCheckRunAnnotations(client, owner, name, run.id) } };
}

export async function readHistory(options: ReadHistoryOptions): Promise<ProjectHistory> {
  const { client, owner, name, branch } = options;
  const [merges, releases, runs, doctor] = await Promise.all([
    getLatestMerges(client, owner, name, branch),
    getLatestReleases(client, owner, name),
    getMainBranchRuns(client, owner, name, branch),
    readDoctorAnswer(options),
  ]);
  return buildHistory({ merges, releases, runs, doctor });
}
