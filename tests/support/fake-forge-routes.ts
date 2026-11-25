// Scripted forge answers for one fictional repository's scan reads (state file, owner-word issues, latest release
// the main branch's workflow runs and the `context-doctor` check run).
import type { FakeFetchRoute } from "@softure-ai/testing";

export const TEST_FORGE_API = "https://forge.example.test";

export interface ScanAnswer {
  readonly status?: number;
  readonly json: unknown;
  readonly headers?: Readonly<Record<string, string>>;
}

/** No release and no workflow runs: a project whose forge facts are empty. */
export const NO_RELEASE: ScanAnswer = { status: 404, json: { message: "Not Found" } };
export const NO_RUNS: ScanAnswer = { json: { total_count: 0, workflow_runs: [] } };
/** No pull request merged into the main branch (read only when the main branch has no CI run). */
export const NO_MERGES: ScanAnswer = { json: [] };
/** No `context-doctor` check run on the main branch's head. */
export const NO_DOCTOR: ScanAnswer = { json: { total_count: 0, check_runs: [] } };

export interface ScanAnswers {
  readonly state?: ScanAnswer;
  /** Issues labelled `owner-word` (the older label). */
  readonly issues?: ScanAnswer;
  /** Issues labelled `cockpit`; none when left out. */
  readonly cockpitIssues?: ScanAnswer;
  /** `releases/latest`. */
  readonly release?: ScanAnswer;
  /** The main branch's workflow runs. */
  readonly runs?: ScanAnswer;
  /** The `context-doctor` check runs on the main branch's head. */
  readonly doctor?: ScanAnswer;
  /** The closed pull requests into the main branch, read when the main branch has no CI run. */
  readonly merges?: ScanAnswer;
  /** The workflow runs at one commit (a merged pull request's head). */
  readonly headRuns?: { readonly sha: string } & ScanAnswer;
}

export function scanRoutes(fullName: string, answers: ScanAnswers, branch = "main"): FakeFetchRoute[] {
  const base = `${TEST_FORGE_API}/repos/${fullName}`;
  const routes: FakeFetchRoute[] = [];
  if (answers.state !== undefined) {
    routes.push({ method: "GET", url: `${base}/contents/context/state.json?ref=${branch}`, ...answers.state });
  }
  if (answers.issues !== undefined) {
    routes.push({ method: "GET", url: `${base}/issues?labels=cockpit&state=all&per_page=100`, ...(answers.cockpitIssues ?? { json: [] }) });
    routes.push({ method: "GET", url: `${base}/issues?labels=owner-word&state=all&per_page=100`, ...answers.issues });
  }
  if (answers.release !== undefined) {
    routes.push({ method: "GET", url: `${base}/releases/latest`, ...answers.release });
  }
  if (answers.runs !== undefined) {
    routes.push({
      method: "GET",
      url: `${base}/actions/runs?branch=${branch}&per_page=100&exclude_pull_requests=true`,
      ...answers.runs,
    });
  }
  if (answers.doctor !== undefined) {
    routes.push({
      method: "GET",
      url: `${base}/commits/${branch}/check-runs?check_name=context-doctor&filter=latest&per_page=100`,
      ...answers.doctor,
    });
  }
  if (answers.merges !== undefined) {
    routes.push({
      method: "GET",
      url: `${base}/pulls?state=closed&base=${branch}&sort=updated&direction=desc&per_page=50`,
      ...answers.merges,
    });
  }
  if (answers.headRuns !== undefined) {
    const { sha, ...answer } = answers.headRuns;
    routes.push({ method: "GET", url: `${base}/actions/runs?head_sha=${sha}&per_page=100`, ...answer });
  }
  return routes;
}
