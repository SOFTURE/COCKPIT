// A project's doctor result (FR-7): the `context-doctor` check run on the head of its main branch, read as
// `npx softure-skills portfolio --source api` reads it (`ok`, `failing` with its failure codes, `pending`,
// `missing`). The checks API needs a permission a fine-grained token cannot hold, so when it is refused the result
// comes from the jobs of the workflow runs at the branch's head (Actions: read), without the failure codes.
import type { FactUpdate } from "../../modules/overview/facts.ts";
import type { ForgeClient, ForgeRead } from "../forge/client.ts";
import { getCheckRunAnnotations, getCheckRuns, getRunJobs, isCiRun, type CheckRun, type WorkflowRun } from "../forge/runs.ts";
import { parseFailureCodes, type DoctorFailureCode } from "./parse-failure-codes.ts";

/** The CI job the skills installer adds; its check run carries the doctor's result. */
export const DOCTOR_CHECK_NAME = "context-doctor";
/** The annotation of a failing run that lists every failure code with its count. */
export const DOCTOR_CODES_TITLE = "context-doctor failure codes";
/** Workflow runs at the head whose jobs are searched on the fallback path at most. */
export const MAX_FALLBACK_RUNS = 3;

const PASSING_CONCLUSIONS = new Set(["success", "neutral", "skipped"]);

export type DoctorResult =
  | { readonly kind: "ok"; readonly url: string | null }
  /** `codes` is null when they could not be read (no annotation, or no permission to read it). */
  | { readonly kind: "failing"; readonly url: string | null; readonly codes: readonly DoctorFailureCode[] | null }
  | { readonly kind: "pending"; readonly url: string | null }
  | { readonly kind: "missing" };

export type DoctorRead =
  | { readonly kind: "read"; readonly doctor: FactUpdate<DoctorResult> }
  | { readonly kind: "rate_limited"; readonly retryAfterSeconds: number | null };

export interface ReadDoctorOptions {
  readonly client: ForgeClient;
  readonly owner: string;
  readonly name: string;
  readonly branch: string;
  /** The main branch's workflow runs as the scan read them (the fallback's way to the head commit). */
  readonly runs: ForgeRead<WorkflowRun[]>;
}

type Failure = Exclude<ForgeRead<unknown>, { ok: true }>;

function isAccessFailure(failure: Failure): boolean {
  return failure.kind === "refused" || failure.kind === "unauthorized" || failure.kind === "not_found";
}

function toFailedRead(failure: Failure): DoctorRead {
  if (failure.kind === "rate_limited") {
    return { kind: "rate_limited", retryAfterSeconds: failure.retryAfterSeconds };
  }
  return { kind: "read", doctor: { status: isAccessFailure(failure) ? "not_readable" : "unavailable" } };
}

function read(doctor: DoctorResult): DoctorRead {
  return { kind: "read", doctor: { status: "ok", value: doctor } };
}

/** The newest run named `context-doctor`, by start time then id, as portfolio picks it. */
function findNewestDoctorRun(runs: readonly CheckRun[]): CheckRun | null {
  const named = runs.filter((run) => run.name === DOCTOR_CHECK_NAME);
  named.sort((left, right) => (right.startedAt ?? "").localeCompare(left.startedAt ?? "") || right.id - left.id);
  return named[0] ?? null;
}

function toResult(run: CheckRun, codes: readonly DoctorFailureCode[] | null): DoctorResult {
  if (!run.isCompleted) {
    return { kind: "pending", url: run.url };
  }
  if (run.conclusion !== null && PASSING_CONCLUSIONS.has(run.conclusion)) {
    return { kind: "ok", url: run.url };
  }
  return { kind: "failing", url: run.url, codes };
}

function isFailing(run: CheckRun): boolean {
  return toResult(run, null).kind === "failing";
}

async function readFailureCodes(options: ReadDoctorOptions, run: CheckRun): Promise<ForgeRead<DoctorFailureCode[] | null>> {
  if (run.annotationsCount === 0) {
    return { ok: true, value: null };
  }
  const annotations = await getCheckRunAnnotations(options.client, options.owner, options.name, run.id);
  if (!annotations.ok) {
    return annotations.kind === "rate_limited" ? annotations : { ok: true, value: null };
  }
  const listed = annotations.value.find((annotation) => annotation.title === DOCTOR_CODES_TITLE);
  return { ok: true, value: listed?.message ? parseFailureCodes(listed.message) : null };
}

/** The workflow runs at the branch's head (the newest run's commit), CI first. */
function findHeadRuns(runs: readonly WorkflowRun[]): WorkflowRun[] {
  const newest = [...runs].sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
  if (newest === undefined) {
    return [];
  }
  const headSha = newest.headSha;
  const atHead = headSha === null ? [newest] : runs.filter((run) => run.headSha === headSha);
  const withId = atHead.filter((run) => run.id !== null);
  return [...withId.filter(isCiRun), ...withId.filter((run) => !isCiRun(run))].slice(0, MAX_FALLBACK_RUNS);
}

async function readFromJobs(options: ReadDoctorOptions): Promise<DoctorRead> {
  if (!options.runs.ok) {
    return toFailedRead(options.runs);
  }
  for (const run of findHeadRuns(options.runs.value)) {
    if (run.id === null) {
      continue;
    }
    const jobs = await getRunJobs(options.client, options.owner, options.name, run.id);
    if (!jobs.ok) {
      return toFailedRead(jobs);
    }
    const doctor = findNewestDoctorRun(jobs.value);
    if (doctor !== null) {
      return read(toResult(doctor, null));
    }
  }
  return read({ kind: "missing" });
}

export async function readDoctor(options: ReadDoctorOptions): Promise<DoctorRead> {
  const checks = await getCheckRuns(options.client, {
    owner: options.owner,
    name: options.name,
    ref: options.branch,
    checkName: DOCTOR_CHECK_NAME,
  });
  if (!checks.ok) {
    return isAccessFailure(checks) ? readFromJobs(options) : toFailedRead(checks);
  }
  const run = findNewestDoctorRun(checks.value);
  if (run === null) {
    return read({ kind: "missing" });
  }
  if (!isFailing(run)) {
    return read(toResult(run, null));
  }
  const codes = await readFailureCodes(options, run);
  if (!codes.ok) {
    return toFailedRead(codes);
  }
  return read(toResult(run, codes.value));
}
