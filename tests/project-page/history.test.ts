import { fakeFetch, type FakeFetchRoute } from "@softure-ai/testing";
import { describe, expect, it } from "vitest";
import { createForgeClient } from "../../src/forge/client.ts";
import { buildHistoryRuns, buildUnconfiguredHistory } from "../../src/project-page/history/build-history.ts";
import { readHistory } from "../../src/project-page/history/read-history.ts";
import type { WorkflowRun } from "../../src/forge/runs.ts";
import { TEST_FORGE_API } from "../support/fake-forge-routes.ts";

const BASE = `${TEST_FORGE_API}/repos/example-org/alpha-app`;
const URLS = {
  pulls: `${BASE}/pulls?state=closed&base=main&sort=updated&direction=desc&per_page=50`,
  releases: `${BASE}/releases?per_page=10`,
  runs: `${BASE}/actions/runs?branch=main&per_page=100&exclude_pull_requests=true`,
  checks: `${BASE}/commits/main/check-runs?check_name=context-doctor&filter=latest&per_page=100`,
  annotations: `${BASE}/check-runs/10/annotations?per_page=100`,
};

const REFUSED = { status: 403, json: { message: "Resource not accessible by personal access token" } };

function route(url: string, json: unknown, status = 200, headers: Record<string, string> = {}): FakeFetchRoute {
  return { method: "GET", url, status, json, headers };
}

function doctorRun(conclusion: string | null, status = "completed", annotationsCount = 3) {
  return {
    id: 10,
    name: "context-doctor",
    status,
    conclusion,
    html_url: "https://forge.example.test/doctor/10",
    started_at: "2026-11-05T10:00:00Z",
    output: { annotations_count: annotationsCount },
  };
}

const MERGE = { number: 7, title: "Add search", html_url: "https://forge.example.test/pull/7", merged_at: "2026-11-05T09:00:00Z", user: { login: "example-dev" } };
const RELEASE = { tag_name: "v1.0.0", name: null, html_url: "https://forge.example.test/releases/v1.0.0", published_at: "2026-11-04T09:00:00Z", draft: false, prerelease: false };
const CI_RUN = { name: "ci", path: ".github/workflows/ci.yml", status: "completed", conclusion: "success", html_url: "https://forge.example.test/runs/1", created_at: "2026-11-05T10:00:00Z", updated_at: "2026-11-05T10:05:00Z" };

async function read(routes: FakeFetchRoute[]) {
  const forge = fakeFetch(routes);
  const client = createForgeClient({ token: "t", baseUrl: TEST_FORGE_API, fetch: forge.fetch });
  const history = await readHistory({ client, owner: "example-org", name: "alpha-app", branch: "main" });
  forge.expectAllUsed();
  return history;
}

function run(overrides: Partial<WorkflowRun>): WorkflowRun {
  return {
    id: 1,
    headSha: "abc",
    name: "ci",
    path: ".github/workflows/ci.yml",
    isCompleted: true,
    conclusion: "success",
    url: "https://forge.example.test/run",
    createdAt: "2026-11-05T10:00:00Z",
    updatedAt: "2026-11-05T10:05:00Z",
    ...overrides,
  };
}

describe("readHistory", () => {
  it("shows merges, releases, runs and the doctor's findings with code, file and the total", async () => {
    const history = await read([
      route(URLS.pulls, [MERGE]),
      route(URLS.releases, [RELEASE]),
      route(URLS.runs, { total_count: 1, workflow_runs: [CI_RUN] }),
      route(URLS.checks, { total_count: 1, check_runs: [doctorRun("failure")] }),
      route(URLS.annotations, [
        { title: "context-doctor failure codes", message: "roadmap-left (1), archive-unstamped (2)", path: ".github" },
        { title: "roadmap-left", message: "the roadmap is left after its archive", path: "context/foundation/roadmap.md" },
        { title: "archive-unstamped", message: "change.md is not stamped", path: "context/archive/2026-11-01-alpha/change.md" },
      ]),
    ]);
    expect(history.merges).toEqual({
      status: "ok",
      value: [{ number: 7, title: "Add search", url: "https://forge.example.test/pull/7", mergedAt: "2026-11-05T09:00:00Z", author: "example-dev", headSha: null }],
    });
    expect(history.releases).toMatchObject({ status: "ok", value: [{ version: "v1.0.0", publishedAt: "2026-11-04T09:00:00Z" }] });
    expect(history.runs).toEqual({
      status: "ok",
      value: {
        ci: [{ name: "ci", result: "passed", url: "https://forge.example.test/runs/1", createdAt: "2026-11-05T10:00:00Z" }],
        ciPullRequest: null,
        qualityReview: [],
      },
    });
    expect(history.doctor).toEqual({
      status: "ok",
      value: {
        kind: "failing",
        url: "https://forge.example.test/doctor/10",
        total: 3,
        findings: [
          { code: "roadmap-left", file: "context/foundation/roadmap.md", message: "the roadmap is left after its archive" },
          { code: "archive-unstamped", file: "context/archive/2026-11-01-alpha/change.md", message: "change.md is not stamped" },
        ],
      },
    });
  });

  it("gives each refused or failed read as its own block's reason while the others load", async () => {
    const history = await read([
      route(URLS.pulls, REFUSED.json, 403, { "x-accepted-github-permissions": "pull_requests=read" }),
      route(URLS.releases, { message: "Bad gateway" }, 502),
      route(URLS.runs, { total_count: 1, workflow_runs: [CI_RUN] }),
      route(URLS.checks, REFUSED.json, 403, { "x-accepted-github-permissions": "checks=read" }),
    ]);
    expect(history.merges).toEqual({ status: "failed", reason: "refused", permission: "pull_requests=read" });
    expect(history.releases).toEqual({ status: "failed", reason: "unavailable", permission: null });
    expect(history.runs.status).toBe("ok");
    expect(history.doctor).toEqual({ status: "failed", reason: "refused", permission: "checks=read" });
  });

  it("says when the doctor passed, is pending or is missing, without reading annotations", async () => {
    const base = [route(URLS.pulls, []), route(URLS.releases, []), route(URLS.runs, { total_count: 0, workflow_runs: [] })];
    expect((await read([...base, route(URLS.checks, { total_count: 1, check_runs: [doctorRun("success", "completed", 0)] })])).doctor).toEqual({
      status: "ok",
      value: { kind: "ok", url: "https://forge.example.test/doctor/10" },
    });
    expect((await read([...base, route(URLS.checks, { total_count: 1, check_runs: [doctorRun(null, "in_progress", 0)] })])).doctor).toEqual({
      status: "ok",
      value: { kind: "pending", url: "https://forge.example.test/doctor/10" },
    });
    expect((await read([...base, route(URLS.checks, { total_count: 0, check_runs: [] })])).doctor).toEqual({ status: "ok", value: { kind: "missing" } });
  });

  it("lists a failing doctor without findings when it wrote no annotation, and names an unreadable annotation read", async () => {
    const base = [route(URLS.pulls, []), route(URLS.releases, []), route(URLS.runs, { total_count: 0, workflow_runs: [] })];
    expect((await read([...base, route(URLS.checks, { total_count: 1, check_runs: [doctorRun("failure", "completed", 0)] })])).doctor).toEqual({
      status: "ok",
      value: { kind: "failing", url: "https://forge.example.test/doctor/10", findings: [], total: null },
    });
    const refused = await read([...base, route(URLS.checks, { total_count: 1, check_runs: [doctorRun("failure")] }), route(URLS.annotations, REFUSED.json, 403)]);
    expect(refused.doctor).toEqual({ status: "failed", reason: "refused", permission: null });
  });
});

describe("buildHistoryRuns", () => {
  it("keeps the latest five CI and five quality-review runs, newest first, with their result", () => {
    const runs = [
      ...Array.from({ length: 7 }, (_, index) => run({ createdAt: `2026-11-0${String(index + 1)}T10:00:00Z`, url: `ci-${String(index + 1)}` })),
      run({ name: "quality-review", path: ".github/workflows/quality-review.yml", conclusion: "failure", url: "qr-1" }),
      run({ name: "quality-review", path: ".github/workflows/quality-review.yml", isCompleted: false, conclusion: null, createdAt: "2026-11-09T10:00:00Z", url: "qr-2" }),
      run({ name: "deploy", path: ".github/workflows/deploy.yml", url: "deploy" }),
    ];
    const built = buildHistoryRuns(runs);
    expect(built.ci.map((entry) => entry.url)).toEqual(["ci-7", "ci-6", "ci-5", "ci-4", "ci-3"]);
    expect(built.qualityReview.map((entry) => [entry.url, entry.result])).toEqual([
      ["qr-2", "running"],
      ["qr-1", "failed"],
    ]);
  });

  it("is empty when there are no runs", () => {
    expect(buildHistoryRuns([])).toEqual({ ci: [], ciPullRequest: null, qualityReview: [] });
  });
});

describe("readHistory without CI on the main branch", () => {
  const headRunsUrl = `${BASE}/actions/runs?head_sha=feed07&per_page=100`;
  const mergeWithHead = { ...MERGE, head: { sha: "feed07" } };
  const checksRun = { name: "checks", path: ".github/workflows/checks.yml", status: "completed", conclusion: "failure", html_url: "https://forge.example.test/runs/70", created_at: "2026-11-05T08:00:00Z", updated_at: "2026-11-05T08:10:00Z" };

  it("lists the last merged pull request's head runs as its CI, with that pull request", async () => {
    const history = await read([
      route(URLS.pulls, [mergeWithHead]),
      route(URLS.releases, []),
      route(URLS.runs, { total_count: 0, workflow_runs: [] }),
      route(URLS.checks, { total_count: 0, check_runs: [] }),
      route(headRunsUrl, { total_count: 1, workflow_runs: [checksRun] }),
    ]);
    expect(history.runs).toEqual({
      status: "ok",
      value: {
        ci: [{ name: "checks", result: "failed", url: "https://forge.example.test/runs/70", createdAt: "2026-11-05T08:00:00Z" }],
        ciPullRequest: { number: 7, url: "https://forge.example.test/pull/7" },
        qualityReview: [],
      },
    });
  });

  it("reads no head runs when the main branch has a CI run", async () => {
    const history = await read([
      route(URLS.pulls, [mergeWithHead]),
      route(URLS.releases, []),
      route(URLS.runs, { total_count: 1, workflow_runs: [CI_RUN] }),
      route(URLS.checks, { total_count: 0, check_runs: [] }),
    ]);
    expect(history.runs).toMatchObject({ status: "ok", value: { ciPullRequest: null } });
  });
});

describe("buildHistoryRuns with a merged pull request's runs", () => {
  const merge = { number: 9, title: "Fix", url: "https://forge.example.test/pull/9", mergedAt: "2026-11-05T09:00:00Z", author: null, headSha: "abc" };

  it("keeps the main branch's CI when it has some", () => {
    const built = buildHistoryRuns([run({ url: "main-ci" })], { merge, runs: [run({ url: "pr-ci" })] });
    expect(built.ci.map((entry) => entry.url)).toEqual(["main-ci"]);
    expect(built.ciPullRequest).toBeNull();
  });

  it("leaves the quality review and the deploy out of the pull request's CI", () => {
    const built = buildHistoryRuns([], {
      merge,
      runs: [
        run({ name: "quality-review", path: ".github/workflows/quality-review.yml", url: "qr" }),
        run({ name: "deploy", path: ".github/workflows/deploy.yml", url: "deploy" }),
        run({ name: "tests", path: ".github/workflows/tests.yml", url: "tests" }),
      ],
    });
    expect(built).toEqual({
      ci: [{ name: "tests", result: "passed", url: "tests", createdAt: "2026-11-05T10:00:00Z" }],
      ciPullRequest: { number: 9, url: "https://forge.example.test/pull/9" },
      qualityReview: [],
    });
  });

  it("shows none when the pull request has no CI run either", () => {
    expect(buildHistoryRuns([], { merge, runs: [] })).toEqual({ ci: [], ciPullRequest: null, qualityReview: [] });
  });
});

describe("buildUnconfiguredHistory", () => {
  it("says in every block that no forge access is configured", () => {
    const failed = { status: "failed", reason: "not_configured", permission: null };
    expect(buildUnconfiguredHistory()).toEqual({ merges: failed, releases: failed, runs: failed, doctor: failed });
  });
});
