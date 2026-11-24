import { fakeFetch } from "@softure-ai/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { insertRepository } from "../../modules/projects/queries.ts";
import { findAdapterReads } from "../../modules/adapters/reads.ts";
import { findForgeFacts } from "../../modules/overview/facts.ts";
import { findReads } from "../../modules/projects/reads.ts";
import type { AdapterRead, ProjectAdapter } from "../../src/adapters/contract.ts";
import { createForgeClient } from "../../src/forge/client.ts";
import { scanProjects } from "../../src/scan/scan-projects.ts";
import { NO_DOCTOR, NO_MERGES, NO_RELEASE, NO_RUNS, scanRoutes, TEST_FORGE_API } from "../support/fake-forge-routes.ts";
import { createStateFixture } from "../support/state-fixture.ts";
import { createTestContext, TEST_START, type TestContext } from "../support/test-context.ts";

/** A project without releases, workflow runs or a doctor check run. */
const NO_FACTS = { release: NO_RELEASE, runs: NO_RUNS, doctor: NO_DOCTOR, merges: NO_MERGES };

const ISSUE = {
  number: 7,
  title: "Owner word: pick the mail provider",
  state: "open",
  body: "yes",
  html_url: "https://forge.example.test/example-org/alpha-app/issues/7",
  created_at: "2026-11-01T10:00:00Z",
  closed_at: null,
};

async function watch(context: TestContext, fullName: string) {
  await insertRepository(context.db, {
    key: fullName,
    fullName,
    defaultBranch: "main",
    hasState: true,
    missingPermissions: [],
    checkedAt: TEST_START,
  });
}

async function readsByKey(context: TestContext) {
  const reads = await findReads(context.db);
  if (!reads.ok) {
    throw new Error("reads must load");
  }
  return Object.fromEntries(reads.value.map((read) => [read.key, read]));
}

describe("scanProjects", () => {
  let context: TestContext;

  beforeEach(async () => {
    context = await createTestContext();
    for (const name of ["example-org/alpha-app", "example-org/beta-app", "example-org/gamma-app"]) {
      await watch(context, name);
    }
  });

  afterEach(async () => {
    await context.database.close();
  });

  it("reads every project, records the failing one with its reason and goes on", async () => {
    const forge = fakeFetch([
      ...scanRoutes("example-org/alpha-app", { state: { json: createStateFixture() }, issues: { json: [ISSUE] }, ...NO_FACTS }),
      ...scanRoutes("example-org/beta-app", { state: { status: 503, json: { message: "down" } }, issues: { status: 503, json: {} }, ...NO_FACTS }),
      ...scanRoutes("example-org/gamma-app", { state: { json: createStateFixture({ project: "gamma-app" }) }, issues: { json: [] }, ...NO_FACTS }),
    ]);
    const client = createForgeClient({ token: "test-token", baseUrl: TEST_FORGE_API, fetch: forge.fetch });

    const outcome = await scanProjects({ db: context.db, client, clock: context.clock });

    expect(outcome).toEqual({ ok: true, value: { kind: "done", summary: { read: 2, failed: 1 } } });
    const reads = await readsByKey(context);
    expect(reads["example-org/alpha-app"]).toMatchObject({ status: "ok", issuesStatus: "ok", readAt: TEST_START, lastGoodAt: TEST_START });
    expect(reads["example-org/alpha-app"]?.issues).toEqual([
      { number: 7, title: ISSUE.title, state: "open", body: "yes", url: ISSUE.html_url, createdAt: ISSUE.created_at, closedAt: null },
    ]);
    expect(reads["example-org/beta-app"]).toMatchObject({ status: "unavailable", state: null, lastGoodAt: null });
    expect(reads["example-org/gamma-app"]).toMatchObject({ status: "ok" });
    expect(forge.calls.every((call) => call.method === "GET")).toBe(true);
    forge.expectAllUsed();
  });

  it("marks missing, too old and invalid states, keeping the last good one", async () => {
    const first = fakeFetch([
      ...scanRoutes("example-org/alpha-app", { state: { json: createStateFixture() }, issues: { json: [] }, ...NO_FACTS }),
      ...scanRoutes("example-org/beta-app", { state: { status: 404, json: { message: "Not Found" } }, issues: { json: [] }, ...NO_FACTS }),
      ...scanRoutes("example-org/gamma-app", { state: { json: { ...createStateFixture(), schema_version: 1 } }, issues: { json: [] }, ...NO_FACTS }),
    ]);
    await scanProjects({ db: context.db, client: createForgeClient({ token: "t", baseUrl: TEST_FORGE_API, fetch: first.fetch }), clock: context.clock });

    context.clock.advance(30 * 60_000);
    const second = fakeFetch([
      ...scanRoutes("example-org/alpha-app", { state: { json: { schema_version: 2 } }, issues: { status: 503, json: {} }, ...NO_FACTS }),
      ...scanRoutes("example-org/beta-app", { state: { status: 404, json: { message: "Not Found" } }, issues: { json: [] }, ...NO_FACTS }),
      ...scanRoutes("example-org/gamma-app", { state: { json: { ...createStateFixture(), schema_version: 1 } }, issues: { json: [] }, ...NO_FACTS }),
    ]);
    await scanProjects({ db: context.db, client: createForgeClient({ token: "t", baseUrl: TEST_FORGE_API, fetch: second.fetch }), clock: context.clock });

    const reads = await readsByKey(context);
    expect(reads["example-org/alpha-app"]).toMatchObject({ status: "state_invalid", issuesStatus: "unavailable", lastGoodAt: TEST_START });
    expect(reads["example-org/alpha-app"]?.state).toMatchObject({ project: "alpha-app" });
    expect(reads["example-org/beta-app"]).toMatchObject({ status: "no_state" });
    expect(reads["example-org/gamma-app"]).toMatchObject({ status: "state_too_old", state: null });
  });

  it("stores the latest release and the last CI and quality-review runs, keeping them when a later read fails", async () => {
    const runs = {
      json: {
        total_count: 3,
        workflow_runs: [
          { name: "quality-review", path: ".github/workflows/quality-review.yml", status: "completed", conclusion: "success", html_url: "https://forge.example.test/qr", created_at: "2026-11-01T08:00:00Z", updated_at: "2026-11-01T08:30:00Z" },
          { name: "ci", path: ".github/workflows/ci.yml", status: "completed", conclusion: "failure", html_url: "https://forge.example.test/ci", created_at: "2026-11-01T09:00:00Z", updated_at: "2026-11-01T09:05:00Z" },
          { name: "ci-usage", path: ".github/workflows/ci-usage.yml", status: "completed", conclusion: "success", html_url: "https://forge.example.test/usage", created_at: "2026-11-01T10:00:00Z", updated_at: "2026-11-01T10:01:00Z" },
        ],
      },
    };
    const first = fakeFetch([
      ...scanRoutes("example-org/alpha-app", {
        state: { json: createStateFixture() },
        issues: { json: [] },
        release: { json: { tag_name: "v0.4.1", published_at: "2026-11-03T12:00:00Z" } },
        runs,
        doctor: NO_DOCTOR,
      }),
      ...scanRoutes("example-org/beta-app", { state: { json: createStateFixture() }, issues: { json: [] }, ...NO_FACTS }),
      ...scanRoutes("example-org/gamma-app", {
        state: { json: createStateFixture() },
        issues: { json: [] },
        release: NO_RELEASE,
        runs: { status: 403, json: { message: "Resource not accessible" }, headers: { "x-accepted-github-permissions": "actions=read" } },
        doctor: NO_DOCTOR,
      }),
    ]);
    await scanProjects({ db: context.db, client: createForgeClient({ token: "t", baseUrl: TEST_FORGE_API, fetch: first.fetch }), clock: context.clock });
    first.expectAllUsed();

    const stored = await findForgeFacts(context.db);
    const byKey = Object.fromEntries((stored.ok ? stored.value : []).map((facts) => [facts.key, facts]));
    expect(byKey["example-org/alpha-app"]).toMatchObject({
      release: { version: "v0.4.1", date: "2026-11-03" },
      releaseStatus: "ok",
      ciRun: { result: "failed", url: "https://forge.example.test/ci", at: "2026-11-01T09:05:00Z" },
      qualityReviewRun: { result: "passed", url: "https://forge.example.test/qr", at: "2026-11-01T08:30:00Z" },
      runsStatus: "ok",
      readAt: TEST_START,
    });
    expect(byKey["example-org/beta-app"]).toMatchObject({ release: null, ciRun: null, qualityReviewRun: null, runsStatus: "ok" });
    expect(byKey["example-org/gamma-app"]).toMatchObject({ runsStatus: "not_readable", ciRun: null });

    context.clock.advance(30 * 60_000);
    const second = fakeFetch([
      ...scanRoutes("example-org/alpha-app", {
        state: { json: createStateFixture() },
        issues: { json: [] },
        release: { status: 503, json: {} },
        runs: { status: 503, json: {} },
        doctor: { status: 503, json: {} },
      }),
      ...scanRoutes("example-org/beta-app", { state: { json: createStateFixture() }, issues: { json: [] }, ...NO_FACTS }),
      ...scanRoutes("example-org/gamma-app", { state: { json: createStateFixture() }, issues: { json: [] }, ...NO_FACTS }),
    ]);
    await scanProjects({ db: context.db, client: createForgeClient({ token: "t", baseUrl: TEST_FORGE_API, fetch: second.fetch }), clock: context.clock });

    const kept = await findForgeFacts(context.db);
    const alpha = (kept.ok ? kept.value : []).find((facts) => facts.key === "example-org/alpha-app");
    expect(alpha).toMatchObject({
      release: { version: "v0.4.1" },
      releaseStatus: "unavailable",
      ciRun: { result: "failed" },
      runsStatus: "unavailable",
    });
  });

  it("stores the doctor result from the check run, or from the head's jobs when the checks API is refused", async () => {
    const failingRun = {
      id: 55,
      name: "context-doctor",
      status: "completed",
      conclusion: "failure",
      html_url: "https://forge.example.test/doctor/55",
      started_at: "2026-11-01T09:00:00Z",
      output: { annotations_count: 3 },
    };
    const headRuns = {
      json: {
        total_count: 1,
        workflow_runs: [
          { id: 900, head_sha: "beef01", name: "ci", path: ".github/workflows/ci.yml", status: "in_progress", conclusion: null, html_url: "https://forge.example.test/ci/900", created_at: "2026-11-01T09:00:00Z", updated_at: "2026-11-01T09:01:00Z" },
        ],
      },
    };
    const forge = fakeFetch([
      ...scanRoutes("example-org/alpha-app", {
        state: { json: createStateFixture() },
        issues: { json: [] },
        release: NO_RELEASE,
        runs: NO_RUNS,
        merges: NO_MERGES,
        doctor: { json: { total_count: 1, check_runs: [failingRun] } },
      }),
      {
        method: "GET",
        url: `${TEST_FORGE_API}/repos/example-org/alpha-app/check-runs/55/annotations?per_page=100`,
        json: [{ title: "context-doctor failure codes", message: "archive.unstamped (1), roadmap.stale (2)" }],
      },
      ...scanRoutes("example-org/beta-app", {
        state: { json: createStateFixture() },
        issues: { json: [] },
        release: NO_RELEASE,
        runs: headRuns,
        merges: NO_MERGES,
        doctor: { status: 403, json: { message: "Resource not accessible by personal access token" } },
      }),
      {
        method: "GET",
        url: `${TEST_FORGE_API}/repos/example-org/beta-app/actions/runs/900/jobs?filter=latest&per_page=100`,
        json: { total_count: 1, jobs: [{ id: 901, name: "context-doctor", status: "in_progress", conclusion: null, html_url: "https://forge.example.test/job/901", started_at: "2026-11-01T09:00:30Z" }] },
      },
      ...scanRoutes("example-org/gamma-app", { state: { json: createStateFixture() }, issues: { json: [] }, ...NO_FACTS }),
    ]);
    await scanProjects({ db: context.db, client: createForgeClient({ token: "t", baseUrl: TEST_FORGE_API, fetch: forge.fetch }), clock: context.clock });
    forge.expectAllUsed();

    const stored = await findForgeFacts(context.db);
    const byKey = Object.fromEntries((stored.ok ? stored.value : []).map((facts) => [facts.key, facts]));
    expect(byKey["example-org/alpha-app"]).toMatchObject({
      doctorStatus: "ok",
      doctor: {
        kind: "failing",
        url: "https://forge.example.test/doctor/55",
        codes: [
          { code: "archive.unstamped", count: 1 },
          { code: "roadmap.stale", count: 2 },
        ],
      },
    });
    expect(byKey["example-org/beta-app"]).toMatchObject({ doctorStatus: "ok", doctor: { kind: "pending", url: "https://forge.example.test/job/901" } });
    expect(byKey["example-org/gamma-app"]).toMatchObject({ doctorStatus: "ok", doctor: { kind: "missing" } });
  });

  it("stores the last merged pull request's CI when the main branch has none, and keeps the main branch's otherwise", async () => {
    const mainRuns = {
      json: {
        total_count: 1,
        workflow_runs: [
          { name: "ci", path: ".github/workflows/ci.yml", status: "completed", conclusion: "success", html_url: "https://forge.example.test/main-ci", created_at: "2026-11-01T09:00:00Z", updated_at: "2026-11-01T09:05:00Z" },
        ],
      },
    };
    const merged = (repository: string, sha: string) => ({
      json: [
        { number: 12, title: "Add search", html_url: `https://forge.example.test/${repository}/pull/12`, merged_at: "2026-11-02T10:00:00Z", head: { sha } },
        { number: 11, title: "Closed unmerged", html_url: `https://forge.example.test/${repository}/pull/11`, merged_at: null, head: { sha: "dead11" } },
      ],
    });
    const forge = fakeFetch([
      ...scanRoutes("example-org/alpha-app", {
        state: { json: createStateFixture() },
        issues: { json: [] },
        release: NO_RELEASE,
        runs: NO_RUNS,
        doctor: NO_DOCTOR,
        merges: merged("alpha-app", "feed12"),
        headRuns: {
          sha: "feed12",
          json: {
            total_count: 3,
            workflow_runs: [
              { name: "checks", path: ".github/workflows/checks.yml", status: "completed", conclusion: "failure", html_url: "https://forge.example.test/pr-checks", created_at: "2026-11-02T09:00:00Z", updated_at: "2026-11-02T09:10:00Z" },
              { name: "tests", path: ".github/workflows/tests.yml", status: "completed", conclusion: "success", html_url: "https://forge.example.test/pr-tests", created_at: "2026-11-02T09:00:00Z", updated_at: "2026-11-02T09:20:00Z" },
              { name: "quality-review", path: ".github/workflows/quality-review.yml", status: "completed", conclusion: "success", html_url: "https://forge.example.test/pr-qr", created_at: "2026-11-02T09:00:00Z", updated_at: "2026-11-02T09:30:00Z" },
            ],
          },
        },
      }),
      ...scanRoutes("example-org/beta-app", { state: { json: createStateFixture() }, issues: { json: [] }, release: NO_RELEASE, runs: mainRuns, doctor: NO_DOCTOR }),
      ...scanRoutes("example-org/gamma-app", {
        state: { json: createStateFixture() },
        issues: { json: [] },
        release: NO_RELEASE,
        runs: NO_RUNS,
        doctor: NO_DOCTOR,
        merges: merged("gamma-app", "feed13"),
        headRuns: { sha: "feed13", json: { total_count: 0, workflow_runs: [] } },
      }),
    ]);
    await scanProjects({ db: context.db, client: createForgeClient({ token: "t", baseUrl: TEST_FORGE_API, fetch: forge.fetch }), clock: context.clock });
    forge.expectAllUsed();

    const stored = await findForgeFacts(context.db);
    const byKey = Object.fromEntries((stored.ok ? stored.value : []).map((facts) => [facts.key, facts]));
    expect(byKey["example-org/alpha-app"]?.ciRun).toEqual({
      result: "failed",
      url: "https://forge.example.test/pr-checks",
      at: "2026-11-02T09:20:00Z",
      pullRequest: { number: 12, url: "https://forge.example.test/alpha-app/pull/12" },
    });
    expect(byKey["example-org/beta-app"]?.ciRun).toEqual({ result: "passed", url: "https://forge.example.test/main-ci", at: "2026-11-01T09:05:00Z", pullRequest: null });
    expect(byKey["example-org/gamma-app"]).toMatchObject({ ciRun: null, runsStatus: "ok" });
  });

  it("stops at a rate-limited read of the last merged pull request", async () => {
    const forge = fakeFetch([
      ...scanRoutes("example-org/alpha-app", {
        state: { json: createStateFixture() },
        issues: { json: [] },
        release: NO_RELEASE,
        runs: NO_RUNS,
        doctor: NO_DOCTOR,
        merges: { status: 429, json: { message: "slow down" }, headers: { "retry-after": "60" } },
      }),
    ]);
    const client = createForgeClient({ token: "t", baseUrl: TEST_FORGE_API, fetch: forge.fetch });
    expect(await scanProjects({ db: context.db, client, clock: context.clock })).toEqual({
      ok: true,
      value: { kind: "retry_later", seconds: 60, summary: { read: 0, failed: 0 } },
    });
    expect(await findForgeFacts(context.db)).toEqual({ ok: true, value: [] });
  });

  it("stops at a rate-limited forge-facts read and records nothing for that project", async () => {
    const forge = fakeFetch([
      ...scanRoutes("example-org/alpha-app", {
        state: { json: createStateFixture() },
        issues: { json: [] },
        release: { status: 429, json: { message: "slow down" }, headers: { "retry-after": "90" } },
      }),
    ]);
    const client = createForgeClient({ token: "t", baseUrl: TEST_FORGE_API, fetch: forge.fetch });
    expect(await scanProjects({ db: context.db, client, clock: context.clock })).toEqual({
      ok: true,
      value: { kind: "retry_later", seconds: 90, summary: { read: 0, failed: 0 } },
    });
    expect(await findReads(context.db)).toEqual({ ok: true, value: [] });
    expect(await findForgeFacts(context.db)).toEqual({ ok: true, value: [] });
  });

  it("stops and asks to run again when the forge's budget runs low", async () => {
    const resetAt = Math.floor(TEST_START.getTime() / 1000) + 600;
    const forge = fakeFetch([
      ...scanRoutes("example-org/alpha-app", {
        state: { json: createStateFixture(), headers: { "x-ratelimit-remaining": "40", "x-ratelimit-reset": String(resetAt) } },
        issues: { json: [], headers: { "x-ratelimit-remaining": "39", "x-ratelimit-reset": String(resetAt) } },
        ...NO_FACTS,
      }),
    ]);
    const client = createForgeClient({ token: "t", baseUrl: TEST_FORGE_API, fetch: forge.fetch });
    expect(await scanProjects({ db: context.db, client, clock: context.clock })).toEqual({
      ok: true,
      value: { kind: "retry_later", seconds: 600, summary: { read: 1, failed: 0 } },
    });
  });

  it("waits for the forge's Retry-After on a rate-limited answer", async () => {
    const forge = fakeFetch([
      ...scanRoutes("example-org/alpha-app", { state: { status: 429, json: { message: "slow down" }, headers: { "retry-after": "120" } } }),
    ]);
    const client = createForgeClient({ token: "t", baseUrl: TEST_FORGE_API, fetch: forge.fetch });
    expect(await scanProjects({ db: context.db, client, clock: context.clock })).toEqual({
      ok: true,
      value: { kind: "retry_later", seconds: 120, summary: { read: 0, failed: 0 } },
    });
    expect(await findReads(context.db)).toEqual({ ok: true, value: [] });
  });

  it("runs the adapters it is given after the forge facts and stores each result", async () => {
    const answers: Record<string, AdapterRead<unknown>> = {
      "alpha-app": { status: "value", value: { kind: "unhealthy", firing: ["Alpha app silent"] } },
      "beta-app": { status: "absent" },
      "gamma-app": { status: "unknown", reason: "backend_unavailable" },
    };
    const asked: string[] = [];
    const adapter: ProjectAdapter = {
      id: "observability",
      read: ({ project }) => {
        asked.push(`${project.owner}/${project.name}@${project.branch}`);
        return Promise.resolve(answers[project.name] ?? { status: "absent" });
      },
    };
    const forge = fakeFetch(
      ["alpha-app", "beta-app", "gamma-app"].flatMap((name) =>
        scanRoutes(`example-org/${name}`, { state: { json: createStateFixture({ project: name }) }, issues: { json: [] }, ...NO_FACTS }),
      ),
    );
    const client = createForgeClient({ token: "t", baseUrl: TEST_FORGE_API, fetch: forge.fetch });

    await scanProjects({ db: context.db, client, clock: context.clock, adapters: [adapter] });

    expect(asked).toEqual(["example-org/alpha-app@main", "example-org/beta-app@main", "example-org/gamma-app@main"]);
    const reads = await findAdapterReads(context.db);
    expect(reads.ok && [...reads.value].sort((left, right) => left.key.localeCompare(right.key))).toEqual([
      { key: "example-org/alpha-app", adapter: "observability", status: "value", value: { kind: "unhealthy", firing: ["Alpha app silent"] }, readAt: TEST_START },
      { key: "example-org/beta-app", adapter: "observability", status: "absent", readAt: TEST_START },
      { key: "example-org/gamma-app", adapter: "observability", status: "unknown", reason: "backend_unavailable", readAt: TEST_START },
    ]);
  });

  it("stops at an adapter's forge rate limit and records nothing for that project", async () => {
    const adapter: ProjectAdapter = { id: "observability", read: () => Promise.resolve({ status: "rate_limited", retryAfterSeconds: 45 }) };
    const forge = fakeFetch(scanRoutes("example-org/alpha-app", { state: { json: createStateFixture() }, issues: { json: [] }, ...NO_FACTS }));
    const client = createForgeClient({ token: "t", baseUrl: TEST_FORGE_API, fetch: forge.fetch });
    expect(await scanProjects({ db: context.db, client, clock: context.clock, adapters: [adapter] })).toEqual({
      ok: true,
      value: { kind: "retry_later", seconds: 45, summary: { read: 0, failed: 0 } },
    });
    expect(await findReads(context.db)).toEqual({ ok: true, value: [] });
    expect(await findAdapterReads(context.db)).toEqual({ ok: true, value: [] });
  });
});
