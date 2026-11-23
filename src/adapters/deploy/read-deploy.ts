// The deploy adapter's read (FR-17): the runs of the project's deploy workflow (`.github/workflows/deploy.yml`,
// written by `softure-deploy init`) and the deployment history its release reports keep in the GitHub Releases. Both
// are forge reads (Actions and Contents read); nothing touches the project's servers. A project without the workflow,
// or whose workflow never ran, has no deploy source and shows nothing extra.
import { z } from "zod";
import type { ForgeClient } from "../../forge/client.ts";
import { summarizeRun } from "../../forge/runs.ts";
import type { AdapterContext, AdapterProject, AdapterRead } from "../contract.ts";
import { DEPLOY_WORKFLOW_FILE, type DeployResult, type DeployState, type VerifyResult } from "./deploy-state.ts";
import { parseDeploymentRows, type DeploymentRow } from "./release-report.ts";

/** Runs and releases read per project and scan: one short page each, newest first. */
export const DEPLOY_READ_PAGE = 20;

const PRODUCTION = "production";

const deployRunSchema = z.object({
  id: z.number().int(),
  head_branch: z.string().nullable().optional(),
  event: z.string().nullable().optional(),
  status: z.string().nullable(),
  conclusion: z.string().nullable(),
  // Rendered as a link on the project page: only a web address, never another scheme.
  html_url: z.url({ protocol: /^https?$/ }),
  created_at: z.string(),
  updated_at: z.string().nullable().optional(),
});
type DeployRun = z.infer<typeof deployRunSchema>;

const deployRunsSchema = z.object({ workflow_runs: z.array(deployRunSchema) });

const releasesSchema = z.array(z.object({ tag_name: z.string(), body: z.string().nullable().optional() }));

interface ReportedDeployment extends DeploymentRow {
  readonly tag: string;
}

function repositoryPath(project: AdapterProject): string {
  return `/repos/${encodeURIComponent(project.owner)}/${encodeURIComponent(project.name)}`;
}

/** Every deployment row of the newest releases; empty when the releases cannot be read (the runs still answer). */
async function getReportedDeployments(client: ForgeClient, project: AdapterProject): Promise<ReportedDeployment[]> {
  const answer = await client.getJson(`${repositoryPath(project)}/releases?per_page=${String(DEPLOY_READ_PAGE)}`, releasesSchema);
  if (!answer.ok) {
    return [];
  }
  return answer.value.flatMap((release) => parseDeploymentRows(release.body ?? "").map((row) => ({ ...row, tag: release.tag_name })));
}

function getRunTime(run: DeployRun): string {
  return run.updated_at ?? run.created_at;
}

/** The tag a run deployed when the forge names it: a run started by a published release runs on its tag. */
function getRunTag(run: DeployRun): string | null {
  return run.event === "release" && run.head_branch !== undefined && run.head_branch !== null && run.head_branch !== "" ? run.head_branch : null;
}

function byNewest<T>(time: (value: T) => string): (left: T, right: T) => number {
  return (left, right) => time(right).localeCompare(time(left));
}

function getProduction(runs: readonly DeployRun[], reported: readonly ReportedDeployment[]): DeployState["production"] {
  const fromReports = reported
    .filter((row) => row.outcome === "deployed" && (row.environment === null || row.environment === PRODUCTION))
    .map((row) => ({ version: row.tag, at: row.at }));
  const reportedRunIds = new Set(reported.map((row) => row.runId));
  const fromRuns = runs
    .filter((run) => run.status === "completed" && run.conclusion === "success" && !reportedRunIds.has(run.id))
    .flatMap((run) => {
      const tag = getRunTag(run);
      return tag === null ? [] : [{ version: tag, at: getRunTime(run) }];
    });
  return [...fromReports, ...fromRuns].sort(byNewest((candidate) => candidate.at))[0] ?? null;
}

function toVerify(row: ReportedDeployment | undefined): VerifyResult | null {
  return row?.verify ?? null;
}

function getLastDeploy(run: DeployRun, reported: readonly ReportedDeployment[]): DeployState["last"] {
  const row = reported.find((candidate) => candidate.runId === run.id);
  const summary = summarizeRun({
    id: run.id,
    headSha: null,
    name: "",
    path: "",
    isCompleted: run.status === "completed",
    conclusion: run.conclusion,
    url: run.html_url,
    createdAt: run.created_at,
    updatedAt: getRunTime(run),
  });
  const result: DeployResult = summary.result;
  return {
    result,
    version: row?.tag ?? getRunTag(run),
    verify: result === "running" ? null : toVerify(row),
    failedStep: result === "failed" ? (row?.failedStep ?? null) : null,
    url: run.html_url,
    at: summary.at,
  };
}

export async function readDeploy({ client, project }: AdapterContext): Promise<AdapterRead<DeployState>> {
  const runs = await client.getJson(
    `${repositoryPath(project)}/actions/workflows/${DEPLOY_WORKFLOW_FILE}/runs?per_page=${String(DEPLOY_READ_PAGE)}`,
    deployRunsSchema,
  );
  if (!runs.ok) {
    if (runs.kind === "not_found") {
      return { status: "absent" };
    }
    if (runs.kind === "rate_limited") {
      return { status: "rate_limited", retryAfterSeconds: runs.retryAfterSeconds };
    }
    return { status: "unknown", reason: runs.kind === "invalid_answer" ? "runs_invalid" : "runs_unreadable" };
  }
  const newest = [...runs.value.workflow_runs].sort(byNewest((run) => run.created_at));
  const last = newest[0];
  if (last === undefined) {
    return { status: "absent" };
  }
  const reported = await getReportedDeployments(client, project);
  return { status: "value", value: { production: getProduction(newest, reported), last: getLastDeploy(last, reported) } };
}
