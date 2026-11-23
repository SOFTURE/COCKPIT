import { fakeFetch } from "@softure-ai/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { insertRepository } from "../../modules/projects/queries.ts";
import { findForgeFacts } from "../../modules/overview/facts.ts";
import { findReads } from "../../modules/projects/reads.ts";
import { createForgeClient } from "../../src/forge/client.ts";
import { scanProjects } from "../../src/scan/scan-projects.ts";
import { NO_RELEASE, NO_RUNS, scanRoutes, TEST_FORGE_API } from "../support/fake-forge-routes.ts";
import { createStateFixture } from "../support/state-fixture.ts";
import { createTestContext, TEST_START, type TestContext } from "../support/test-context.ts";

/** A project without releases or workflow runs. */
const NO_FACTS = { release: NO_RELEASE, runs: NO_RUNS };

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
      }),
      ...scanRoutes("example-org/beta-app", { state: { json: createStateFixture() }, issues: { json: [] }, ...NO_FACTS }),
      ...scanRoutes("example-org/gamma-app", {
        state: { json: createStateFixture() },
        issues: { json: [] },
        release: NO_RELEASE,
        runs: { status: 403, json: { message: "Resource not accessible" }, headers: { "x-accepted-github-permissions": "actions=read" } },
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
});
