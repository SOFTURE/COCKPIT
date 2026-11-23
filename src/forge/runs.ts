// The newest workflow runs on a repository's main branch, and which of them are its CI and its quality review.
// SOFTURE projects run CI as the workflow `ci` (`.github/workflows/ci.yml`) and the quality review as
// `quality-review` (or `quality-review-packages`), from `@softure-ai/quality-review`'s examples.
import { z } from "zod";
import type { ForgeClient, ForgeRead } from "./client.ts";

/** Runs read per project and scan: one page, newest first. */
export const RUNS_PER_READ = 100;

const runSchema = z.object({
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
