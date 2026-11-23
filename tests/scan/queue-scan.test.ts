import { runDueJobs } from "@softure-ai/jobs/testing";
import { fakeFetch } from "@softure-ai/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { insertRepository } from "../../modules/projects/queries.ts";
import { findReads } from "../../modules/projects/reads.ts";
import { createForgeClient } from "../../src/forge/client.ts";
import { queueScan } from "../../src/scan/queue-scan.ts";
import { createScanHandler } from "../../src/scan/scan-handler.ts";
import { SCAN_QUEUE } from "../../src/scan/scan-queue.ts";
import { NO_DOCTOR, NO_RELEASE, NO_RUNS, scanRoutes, TEST_FORGE_API } from "../support/fake-forge-routes.ts";
import { createStateFixture } from "../support/state-fixture.ts";
import { createTestContext, TEST_START, type TestContext } from "../support/test-context.ts";

describe("queueing a scan after a repository is added", () => {
  let context: TestContext;

  beforeEach(async () => {
    context = await createTestContext();
  });

  afterEach(async () => {
    await context.database.close();
  });

  it("reads a repository added after this period's scan on the next run of due jobs", async () => {
    const forge = fakeFetch(
      scanRoutes("example-org/kappa-app", { state: { json: createStateFixture() }, issues: { json: [] }, release: NO_RELEASE, runs: NO_RUNS, doctor: NO_DOCTOR }),
    );
    const client = createForgeClient({ token: "t", baseUrl: TEST_FORGE_API, fetch: forge.fetch });
    const handlers = { [SCAN_QUEUE]: createScanHandler(() => client) };
    // This period's scheduled scan runs while nothing is watched yet.
    await runDueJobs(context, { handlers });
    await insertRepository(context.db, {
      key: "example-org/kappa-app",
      fullName: "example-org/kappa-app",
      defaultBranch: "main",
      hasState: true,
      missingPermissions: [],
      checkedAt: TEST_START,
    });

    const queued = await queueScan(context, "repository_added");
    await runDueJobs(context, { handlers });

    expect(queued.ok).toBe(true);
    const reads = await findReads(context.db);
    expect(reads.ok && reads.value.map((read) => [read.key, read.status])).toEqual([["example-org/kappa-app", "ok"]]);
  });

  it("leaves a repository added after this period's scan unread until a scan is queued", async () => {
    const forge = fakeFetch([]);
    const client = createForgeClient({ token: "t", baseUrl: TEST_FORGE_API, fetch: forge.fetch });
    const handlers = { [SCAN_QUEUE]: createScanHandler(() => client) };
    await runDueJobs(context, { handlers });
    await insertRepository(context.db, {
      key: "example-org/kappa-app",
      fullName: "example-org/kappa-app",
      defaultBranch: "main",
      hasState: true,
      missingPermissions: [],
      checkedAt: TEST_START,
    });

    await runDueJobs(context, { handlers });

    expect(forge.calls).toHaveLength(0);
    const reads = await findReads(context.db);
    expect(reads.ok && reads.value).toEqual([]);
  });
});
