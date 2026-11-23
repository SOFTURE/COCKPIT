// Scripted forge answers for one fictional repository's scan reads (state file, owner-word issues, latest release
// and the main branch's workflow runs).
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

export interface ScanAnswers {
  readonly state?: ScanAnswer;
  readonly issues?: ScanAnswer;
  /** `releases/latest`. */
  readonly release?: ScanAnswer;
  /** The main branch's workflow runs. */
  readonly runs?: ScanAnswer;
}

export function scanRoutes(fullName: string, answers: ScanAnswers, branch = "main"): FakeFetchRoute[] {
  const base = `${TEST_FORGE_API}/repos/${fullName}`;
  const routes: FakeFetchRoute[] = [];
  if (answers.state !== undefined) {
    routes.push({ method: "GET", url: `${base}/contents/context/state.json?ref=${branch}`, ...answers.state });
  }
  if (answers.issues !== undefined) {
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
  return routes;
}
