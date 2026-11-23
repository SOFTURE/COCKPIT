// The newest workflow runs on a repository's main branch, and which of them are its CI and its quality review.
// SOFTURE projects run CI as the workflow `ci` (`.github/workflows/ci.yml`) and the quality review as
// `quality-review` (or `quality-review-packages`), from `@softure-ai/quality-review`'s examples.
// Also the check runs of a commit, their annotations and the jobs of a workflow run (a job is a check run), which
// the doctor read (`src/doctor/read-doctor.ts`) uses.
import { z } from "zod";
import type { ForgeClient, ForgeRead } from "./client.ts";

/** Runs read per project and scan: one page, newest first. */
export const RUNS_PER_READ = 100;

const runSchema = z.object({
  id: z.number().int().optional(),
  head_sha: z.string().optional(),
  name: z.string().nullable().optional(),
  path: z.string().nullable().optional(),
  status: z.string().nullable(),
  conclusion: z.string().nullable(),
  html_url: z.string(),
  created_at: z.string(),
  updated_at: z.string().nullable().optional(),
});

const runsSchema = z.object({ workflow_runs: z.array(runSchema) });

export interface WorkflowRun {
  /** Null only in answers that leave it out. */
  readonly id: number | null;
  /** The commit the run ran on; null only in answers that leave it out. */
  readonly headSha: string | null;
  readonly name: string;
  /** The workflow file, e.g. `.github/workflows/ci.yml`. */
  readonly path: string;
  readonly isCompleted: boolean;
  readonly conclusion: string | null;
  readonly url: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** A run's outcome as the overview shows it. */
export type RunResult = "passed" | "failed" | "cancelled" | "running";

export interface RunSummary {
  readonly result: RunResult;
  readonly url: string;
  /** When the run last changed (finished, for a completed run). */
  readonly at: string;
}

const FAILED_CONCLUSIONS = new Set(["failure", "timed_out", "startup_failure"]);
const PASSED_CONCLUSIONS = new Set(["success", "neutral", "skipped"]);

export async function getMainBranchRuns(client: ForgeClient, owner: string, name: string, branch: string): Promise<ForgeRead<WorkflowRun[]>> {
  const path =
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/actions/runs` +
    `?branch=${encodeURIComponent(branch)}&per_page=${String(RUNS_PER_READ)}&exclude_pull_requests=true`;
  const answer = await client.getJson(path, runsSchema);
  if (!answer.ok) {
    return answer;
  }
  return {
    ok: true,
    value: answer.value.workflow_runs.map((run) => ({
      id: run.id ?? null,
      headSha: run.head_sha ?? null,
      name: run.name ?? "",
      path: run.path ?? "",
      isCompleted: run.status === "completed",
      conclusion: run.conclusion,
      url: run.html_url,
      createdAt: run.created_at,
      updatedAt: run.updated_at ?? run.created_at,
    })),
  };
}

function getWorkflowFile(run: WorkflowRun): string {
  // A run's path may carry a ref suffix (`.github/workflows/ci.yml@refs/heads/main`).
  return (run.path.split("@")[0] ?? "").split("/").pop()?.toLowerCase() ?? "";
}

export function isCiRun(run: WorkflowRun): boolean {
  const file = getWorkflowFile(run);
  return file === "ci.yml" || file === "ci.yaml" || (file === "" && run.name.toLowerCase() === "ci");
}

export function isQualityReviewRun(run: WorkflowRun): boolean {
  return getWorkflowFile(run).startsWith("quality-review") || run.name.toLowerCase().startsWith("quality-review");
}

export function summarizeRun(run: WorkflowRun): RunSummary {
  let result: RunResult;
  if (!run.isCompleted) {
    result = "running";
  } else if (run.conclusion !== null && FAILED_CONCLUSIONS.has(run.conclusion)) {
    result = "failed";
  } else if (run.conclusion !== null && PASSED_CONCLUSIONS.has(run.conclusion)) {
    result = "passed";
  } else {
    result = "cancelled";
  }
  return { result, url: run.url, at: run.updatedAt };
}

/** The newest run that matches, as a summary; null when none does. */
function findNewest(runs: readonly WorkflowRun[], matches: (run: WorkflowRun) => boolean): RunSummary | null {
  const found = [...runs].filter(matches).sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
  return found === undefined ? null : summarizeRun(found);
}

/** The last completed CI run: an unfinished run says nothing about the branch yet. */
export function findLastCiRun(runs: readonly WorkflowRun[]): RunSummary | null {
  return findNewest(runs, (run) => isCiRun(run) && run.isCompleted);
}

/** The last quality review, finished or not. */
export function findLastQualityReview(runs: readonly WorkflowRun[]): RunSummary | null {
  return findNewest(runs, isQualityReviewRun);
}

/** A check run, or a workflow job (GitHub Actions reports each job as a check run of the same name). */
export interface CheckRun {
  readonly id: number;
  readonly name: string;
  readonly isCompleted: boolean;
  readonly conclusion: string | null;
  readonly url: string | null;
  readonly startedAt: string | null;
  /** How many annotations the run has; null when the answer does not say. */
  readonly annotationsCount: number | null;
}

export interface CheckAnnotation {
  readonly title: string | null;
  readonly message: string | null;
}

const checkRunSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  status: z.string().nullable(),
  conclusion: z.string().nullable(),
  html_url: z.string().nullable().optional(),
  started_at: z.string().nullable().optional(),
  output: z.object({ annotations_count: z.number().int().nullable().optional() }).nullable().optional(),
});
type CheckRunAnswer = z.infer<typeof checkRunSchema>;

const checkRunsSchema = z.object({ check_runs: z.array(checkRunSchema) });
const jobsSchema = z.object({ jobs: z.array(checkRunSchema) });
const annotationsSchema = z.array(z.object({ title: z.string().nullable().optional(), message: z.string().nullable().optional() }));

/** Jobs and annotations read per call at most: one page. */
const PER_PAGE = 100;

function toCheckRun(answer: CheckRunAnswer): CheckRun {
  return {
    id: answer.id,
    name: answer.name,
    isCompleted: answer.status === "completed",
    conclusion: answer.conclusion,
    url: answer.html_url ?? null,
    startedAt: answer.started_at ?? null,
    annotationsCount: answer.output?.annotations_count ?? null,
  };
}

function repositoryPath(owner: string, name: string): string {
  return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
}

export interface CheckRunsQuery {
  readonly owner: string;
  readonly name: string;
  /** A branch name or a commit sha. */
  readonly ref: string;
  readonly checkName: string;
}

/** The latest check runs named `checkName` on the head of `ref` (needs Checks: read on a private repository). */
export async function getCheckRuns(client: ForgeClient, query: CheckRunsQuery): Promise<ForgeRead<CheckRun[]>> {
  const path =
    `${repositoryPath(query.owner, query.name)}/commits/${encodeURIComponent(query.ref)}/check-runs` +
    `?check_name=${encodeURIComponent(query.checkName)}&filter=latest&per_page=${String(PER_PAGE)}`;
  const answer = await client.getJson(path, checkRunsSchema);
  return answer.ok ? { ok: true, value: answer.value.check_runs.map(toCheckRun) } : answer;
}

export async function getCheckRunAnnotations(client: ForgeClient, owner: string, name: string, checkRunId: number): Promise<ForgeRead<CheckAnnotation[]>> {
  const path = `${repositoryPath(owner, name)}/check-runs/${String(checkRunId)}/annotations?per_page=${String(PER_PAGE)}`;
  const answer = await client.getJson(path, annotationsSchema);
  return answer.ok
    ? { ok: true, value: answer.value.map((annotation) => ({ title: annotation.title ?? null, message: annotation.message ?? null })) }
    : answer;
}

/** The latest attempt's jobs of one workflow run (Actions: read is enough). */
export async function getRunJobs(client: ForgeClient, owner: string, name: string, runId: number): Promise<ForgeRead<CheckRun[]>> {
  const path = `${repositoryPath(owner, name)}/actions/runs/${String(runId)}/jobs?filter=latest&per_page=${String(PER_PAGE)}`;
  const answer = await client.getJson(path, jobsSchema);
  return answer.ok ? { ok: true, value: answer.value.jobs.map(toCheckRun) } : answer;
}
