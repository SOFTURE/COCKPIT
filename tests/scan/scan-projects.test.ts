import { fakeFetch } from "@softure-ai/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { insertRepository } from "../../modules/projects/queries.ts";
import { findReads } from "../../modules/projects/reads.ts";
import { createForgeClient } from "../../src/forge/client.ts";
import { scanProjects } from "../../src/scan/scan-projects.ts";
import { scanRoutes, TEST_FORGE_API } from "../support/fake-forge-routes.ts";
import { createStateFixture } from "../support/state-fixture.ts";
import { createTestContext, TEST_START, type TestContext } from "../support/test-context.ts";

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
      ...scanRoutes("example-org/alpha-app", { state: { json: createStateFixture() }, issues: { json: [ISSUE] } }),
      ...scanRoutes("example-org/beta-app", { state: { status: 503, json: { message: "down" } }, issues: { status: 503, json: {} } }),
      ...scanRoutes("example-org/gamma-app", { state: { json: createStateFixture({ project: "gamma-app" }) }, issues: { json: [] } }),
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
      ...scanRoutes("example-org/alpha-app", { state: { json: createStateFixture() }, issues: { json: [] } }),
      ...scanRoutes("example-org/beta-app", { state: { status: 404, json: { message: "Not Found" } }, issues: { json: [] } }),
      ...scanRoutes("example-org/gamma-app", { state: { json: { ...createStateFixture(), schema_version: 1 } }, issues: { json: [] } }),
    ]);
    await scanProjects({ db: context.db, client: createForgeClient({ token: "t", baseUrl: TEST_FORGE_API, fetch: first.fetch }), clock: context.clock });

    context.clock.advance(30 * 60_000);
    const second = fakeFetch([
      ...scanRoutes("example-org/alpha-app", { state: { json: { schema_version: 2 } }, issues: { status: 503, json: {} } }),
      ...scanRoutes("example-org/beta-app", { state: { status: 404, json: { message: "Not Found" } }, issues: { json: [] } }),
      ...scanRoutes("example-org/gamma-app", { state: { json: { ...createStateFixture(), schema_version: 1 } }, issues: { json: [] } }),
    ]);
    await scanProjects({ db: context.db, client: createForgeClient({ token: "t", baseUrl: TEST_FORGE_API, fetch: second.fetch }), clock: context.clock });

    const reads = await readsByKey(context);
    expect(reads["example-org/alpha-app"]).toMatchObject({ status: "state_invalid", issuesStatus: "unavailable", lastGoodAt: TEST_START });
    expect(reads["example-org/alpha-app"]?.state).toMatchObject({ project: "alpha-app" });
    expect(reads["example-org/beta-app"]).toMatchObject({ status: "no_state" });
    expect(reads["example-org/gamma-app"]).toMatchObject({ status: "state_too_old", state: null });
  });

  it("stops and asks to run again when the forge's budget runs low", async () => {
    const resetAt = Math.floor(TEST_START.getTime() / 1000) + 600;
    const forge = fakeFetch([
      ...scanRoutes("example-org/alpha-app", {
        state: { json: createStateFixture(), headers: { "x-ratelimit-remaining": "40", "x-ratelimit-reset": String(resetAt) } },
        issues: { json: [], headers: { "x-ratelimit-remaining": "39", "x-ratelimit-reset": String(resetAt) } },
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
