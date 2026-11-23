import { fakeFetch, type FakeFetchRoute } from "@softure-ai/testing";
import { describe, expect, it } from "vitest";
import { readDoctor } from "../../src/doctor/read-doctor.ts";
import { createForgeClient, type ForgeRead } from "../../src/forge/client.ts";
import type { WorkflowRun } from "../../src/forge/runs.ts";
import { TEST_FORGE_API } from "../support/fake-forge-routes.ts";

const BASE = `${TEST_FORGE_API}/repos/example-org/alpha-app`;
const CHECKS_URL = `${BASE}/commits/main/check-runs?check_name=context-doctor&filter=latest&per_page=100`;

function checkRun(overrides: Record<string, unknown> = {}) {
  return {
    id: 10,
    name: "context-doctor",
    status: "completed",
    conclusion: "success",
    html_url: "https://forge.example.test/doctor/10",
    started_at: "2026-11-05T10:00:00Z",
    output: { annotations_count: 0 },
    ...overrides,
  };
}

function checks(runs: unknown[]): FakeFetchRoute {
  return { method: "GET", url: CHECKS_URL, json: { total_count: runs.length, check_runs: runs } };
}

function annotations(id: number, json: unknown, status = 200): FakeFetchRoute {
  return { method: "GET", url: `${BASE}/check-runs/${String(id)}/annotations?per_page=100`, status, json };
}

function jobs(runId: number, json: unknown, status = 200): FakeFetchRoute {
  return { method: "GET", url: `${BASE}/actions/runs/${String(runId)}/jobs?filter=latest&per_page=100`, status, json };
}

const REFUSED: FakeFetchRoute = { method: "GET", url: CHECKS_URL, status: 403, json: { message: "Resource not accessible by personal access token" } };

function workflowRun(overrides: Partial<WorkflowRun>): WorkflowRun {
  return {
    id: 900,
    headSha: "beef01",
    name: "ci",
    path: ".github/workflows/ci.yml",
    isCompleted: true,
    conclusion: "success",
    url: "https://forge.example.test/ci/900",
    createdAt: "2026-11-05T10:00:00Z",
    updatedAt: "2026-11-05T10:05:00Z",
    ...overrides,
  };
}

async function read(routes: FakeFetchRoute[], runs: ForgeRead<WorkflowRun[]> = { ok: true, value: [] }) {
  const forge = fakeFetch(routes);
  const client = createForgeClient({ token: "t", baseUrl: TEST_FORGE_API, fetch: forge.fetch });
  const result = await readDoctor({ client, owner: "example-org", name: "alpha-app", branch: "main", runs });
  forge.expectAllUsed();
  return result;
}

describe("readDoctor through the checks API", () => {
  it("is ok when the check run passed", async () => {
    expect(await read([checks([checkRun()])])).toEqual({
      kind: "read",
      doctor: { status: "ok", value: { kind: "ok", url: "https://forge.example.test/doctor/10" } },
    });
  });

  it("is failing with the codes and their counts from the codes annotation", async () => {
    const failing = checkRun({ conclusion: "failure", output: { annotations_count: 4 } });
    const result = await read([
      checks([failing]),
      annotations(10, [
        { title: "context-doctor failure codes", message: "archive.unstamped (1), roadmap.stale (2)" },
        { title: "roadmap.stale", message: "context/foundation/roadmap.md is left after its archive" },
      ]),
    ]);
    expect(result).toEqual({
      kind: "read",
      doctor: {
        status: "ok",
        value: {
          kind: "failing",
          url: "https://forge.example.test/doctor/10",
          codes: [
            { code: "archive.unstamped", count: 1 },
            { code: "roadmap.stale", count: 2 },
          ],
        },
      },
    });
  });

  it("is failing without codes when the run has no annotations or they cannot be read", async () => {
    const quiet = await read([checks([checkRun({ conclusion: "timed_out" })])]);
    expect(quiet).toMatchObject({ doctor: { value: { kind: "failing", codes: null } } });
    const refused = await read([checks([checkRun({ conclusion: "failure", output: { annotations_count: 2 } })]), annotations(10, { message: "no" }, 403)]);
    expect(refused).toMatchObject({ doctor: { value: { kind: "failing", codes: null } } });
    const untitled = await read([checks([checkRun({ conclusion: "failure", output: null })]), annotations(10, [{ title: "other", message: "x (1)" }])]);
    expect(untitled).toMatchObject({ doctor: { value: { kind: "failing", codes: null } } });
  });

  it("is pending while the check run has not finished", async () => {
    expect(await read([checks([checkRun({ status: "in_progress", conclusion: null })])])).toMatchObject({
      doctor: { status: "ok", value: { kind: "pending", url: "https://forge.example.test/doctor/10" } },
    });
  });

  it("is missing when the head has no context-doctor check run", async () => {
    expect(await read([checks([checkRun({ name: "context-doctor-lookalike" })])])).toEqual({
      kind: "read",
      doctor: { status: "ok", value: { kind: "missing" } },
    });
  });

  it("takes the newest of several check runs", async () => {
    const result = await read([
      checks([
        checkRun({ id: 11, conclusion: "failure", started_at: "2026-11-04T10:00:00Z" }),
        checkRun({ id: 12, conclusion: "success", started_at: "2026-11-06T10:00:00Z", html_url: "https://forge.example.test/doctor/12" }),
      ]),
    ]);
    expect(result).toMatchObject({ doctor: { value: { kind: "ok", url: "https://forge.example.test/doctor/12" } } });
  });

  it("stops on a rate limit, also while reading the codes", async () => {
    expect(await read([{ method: "GET", url: CHECKS_URL, status: 429, json: {}, headers: { "retry-after": "30" } }])).toEqual({
      kind: "rate_limited",
      retryAfterSeconds: 30,
    });
    const codes = await read([
      checks([checkRun({ conclusion: "failure", output: { annotations_count: 1 } })]),
      { ...annotations(10, {}, 429), headers: { "retry-after": "45" } },
    ]);
    expect(codes).toEqual({ kind: "rate_limited", retryAfterSeconds: 45 });
  });

  it("is unavailable when the forge does not answer", async () => {
    expect(await read([{ method: "GET", url: CHECKS_URL, status: 503, json: {} }])).toEqual({ kind: "read", doctor: { status: "unavailable" } });
  });
});

describe("readDoctor through the head's jobs when the checks API is refused", () => {
  it("reads the context-doctor job of the CI run at the head, without codes", async () => {
    const runs = [
      workflowRun({ id: 899, headSha: "old0001", createdAt: "2026-11-04T10:00:00Z" }),
      workflowRun({ id: 901, name: "quality-review", path: ".github/workflows/quality-review.yml" }),
      workflowRun({ id: 900 }),
    ];
    const result = await read(
      [REFUSED, jobs(900, { total_count: 2, jobs: [checkRun({ id: 1, name: "gates" }), checkRun({ id: 2, conclusion: "failure", html_url: "https://forge.example.test/job/2" })] })],
      { ok: true, value: runs },
    );
    expect(result).toEqual({
      kind: "read",
      doctor: { status: "ok", value: { kind: "failing", url: "https://forge.example.test/job/2", codes: null } },
    });
  });

  it("looks in the other runs at the head before calling it missing", async () => {
    const runs = [workflowRun({ id: 900 }), workflowRun({ id: 901, name: "release", path: ".github/workflows/release.yml" })];
    const found = await read(
      [REFUSED, jobs(900, { total_count: 0, jobs: [] }), jobs(901, { total_count: 1, jobs: [checkRun({ id: 5, status: "queued", conclusion: null })] })],
      { ok: true, value: runs },
    );
    expect(found).toMatchObject({ doctor: { value: { kind: "pending" } } });
    const missing = await read([REFUSED, jobs(900, { total_count: 0, jobs: [] }), jobs(901, { total_count: 0, jobs: [] })], { ok: true, value: runs });
    expect(missing).toEqual({ kind: "read", doctor: { status: "ok", value: { kind: "missing" } } });
  });

  it("is missing when the branch has no workflow runs", async () => {
    expect(await read([REFUSED], { ok: true, value: [] })).toEqual({ kind: "read", doctor: { status: "ok", value: { kind: "missing" } } });
  });

  it("is not readable when neither the checks nor the runs can be read", async () => {
    const runs: ForgeRead<WorkflowRun[]> = { ok: false, kind: "refused", status: 403, acceptedPermissions: "actions=read" };
    expect(await read([REFUSED], runs)).toEqual({ kind: "read", doctor: { status: "not_readable" } });
    expect(await read([REFUSED, jobs(900, {}, 403)], { ok: true, value: [workflowRun({})] })).toEqual({ kind: "read", doctor: { status: "not_readable" } });
  });

  it("searches at most three runs at the head", async () => {
    const runs = [900, 901, 902, 903].map((id) => workflowRun({ id, name: `w${String(id)}`, path: `.github/workflows/w${String(id)}.yml` }));
    const empty = { total_count: 0, jobs: [] };
    expect(await read([REFUSED, jobs(900, empty), jobs(901, empty), jobs(902, empty)], { ok: true, value: runs })).toMatchObject({
      doctor: { value: { kind: "missing" } },
    });
  });
});
