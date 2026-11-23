// A project's history (FR-11) from the forge's answers: the latest merges and releases, the latest CI and
// quality-review runs and the doctor's findings. Each block stands alone: a failed read becomes that block's reason
// and the others still show.
import { DOCTOR_CODES_TITLE, toDoctorResult } from "../../doctor/read-doctor.ts";
import { countFailures, parseFailureCodes } from "../../doctor/parse-failure-codes.ts";
import type { ForgeRead, ForgeReadFailure } from "../../forge/client.ts";
import type { ForgeMerge } from "../../forge/merges.ts";
import type { ForgeReleaseEntry } from "../../forge/releases.ts";
import { isCiRun, isQualityReviewRun, summarizeRun, type CheckAnnotation, type CheckRun, type RunResult, type WorkflowRun } from "../../forge/runs.ts";

/** Runs of each kind shown at most. */
export const RUNS_SHOWN = 5;

/** Why a block could not be read: a forge failure, or no forge access configured at all. */
export type HistoryFailureReason = ForgeReadFailure["kind"] | "not_configured";

export type HistoryBlock<T> =
  | { readonly status: "ok"; readonly value: T }
  /** `permission` is the one the forge named for a refusal (`checks=read`), else null. */
  | { readonly status: "failed"; readonly reason: HistoryFailureReason; readonly permission: string | null };

export interface HistoryRun {
  readonly name: string;
  readonly result: RunResult;
  readonly url: string;
  /** When the run started. */
  readonly createdAt: string;
}

export interface HistoryRuns {
  readonly ci: readonly HistoryRun[];
  readonly qualityReview: readonly HistoryRun[];
}

export interface DoctorFinding {
  readonly code: string;
  /** The file the finding names; null when it names none. */
  readonly file: string | null;
  readonly message: string | null;
}

export type DoctorFindings =
  | { readonly kind: "ok"; readonly url: string | null }
  | { readonly kind: "pending"; readonly url: string | null }
  | { readonly kind: "missing" }
  /** `total` is how many failures the run counted (null when it does not say); the forge lists at most a few. */
  | { readonly kind: "failing"; readonly url: string | null; readonly findings: readonly DoctorFinding[]; readonly total: number | null };

export interface ProjectHistory {
  readonly merges: HistoryBlock<readonly ForgeMerge[]>;
  readonly releases: HistoryBlock<readonly ForgeReleaseEntry[]>;
  readonly runs: HistoryBlock<HistoryRuns>;
  readonly doctor: HistoryBlock<DoctorFindings>;
}

/** The doctor's check run and, when it fails, its annotations (absent when not read). */
export interface DoctorAnswer {
  readonly run: CheckRun | null;
  readonly annotations?: ForgeRead<CheckAnnotation[]>;
}

export interface HistoryAnswers {
  readonly merges: ForgeRead<ForgeMerge[]>;
  readonly releases: ForgeRead<ForgeReleaseEntry[]>;
  readonly runs: ForgeRead<WorkflowRun[]>;
  readonly doctor: ForgeRead<DoctorAnswer>;
}

type Failure = Exclude<ForgeRead<unknown>, { ok: true }>;

export function toFailedBlock(failure: Failure | { readonly kind: "not_configured" }): { readonly status: "failed"; readonly reason: HistoryFailureReason; readonly permission: string | null } {
  return { status: "failed", reason: failure.kind, permission: failure.kind === "refused" ? failure.acceptedPermissions : null };
}

function toBlock<T, U>(answer: ForgeRead<T>, pick: (value: T) => U): HistoryBlock<U> {
  return answer.ok ? { status: "ok", value: pick(answer.value) } : toFailedBlock(answer);
}

function pickRuns(runs: readonly WorkflowRun[], matches: (run: WorkflowRun) => boolean): HistoryRun[] {
  return runs
    .filter(matches)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, RUNS_SHOWN)
    .map((run) => ({ name: run.name, result: summarizeRun(run).result, url: run.url, createdAt: run.createdAt }));
}

export function buildHistoryRuns(runs: readonly WorkflowRun[]): HistoryRuns {
  return { ci: pickRuns(runs, isCiRun), qualityReview: pickRuns(runs, isQualityReviewRun) };
}

/** Each per-failure annotation as a finding; the summary annotation gives the total the run counted. */
function toFailing(run: CheckRun, annotations: readonly CheckAnnotation[]): DoctorFindings {
  const summary = annotations.find((annotation) => annotation.title === DOCTOR_CODES_TITLE);
  const findings = annotations
    .filter((annotation) => annotation !== summary && annotation.title !== null && annotation.title.trim() !== "")
    .map((annotation) => ({ code: (annotation.title ?? "").trim(), file: annotation.path, message: annotation.message }));
  const total = summary?.message ? countFailures(parseFailureCodes(summary.message)) : null;
  return { kind: "failing", url: run.url, findings, total };
}

export function buildDoctorFindings(answer: DoctorAnswer): HistoryBlock<DoctorFindings> {
  if (answer.run === null) {
    return { status: "ok", value: { kind: "missing" } };
  }
  const result = toDoctorResult(answer.run, null);
  if (result.kind !== "failing") {
    return { status: "ok", value: result };
  }
  if (answer.annotations === undefined) {
    return { status: "ok", value: { kind: "failing", url: answer.run.url, findings: [], total: null } };
  }
  const run = answer.run;
  return toBlock(answer.annotations, (annotations) => toFailing(run, annotations));
}

export function buildHistory(answers: HistoryAnswers): ProjectHistory {
  return {
    merges: toBlock(answers.merges, (merges) => merges),
    releases: toBlock(answers.releases, (releases) => releases),
    runs: toBlock(answers.runs, buildHistoryRuns),
    doctor: answers.doctor.ok ? buildDoctorFindings(answers.doctor.value) : toFailedBlock(answers.doctor),
  };
}

/** Every block failed the same way: no forge access is configured. */
export function buildUnconfiguredHistory(): ProjectHistory {
  const failed = toFailedBlock({ kind: "not_configured" });
  return { merges: failed, releases: failed, runs: failed, doctor: failed };
}
