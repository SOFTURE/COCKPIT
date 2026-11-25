import { runScheduleNow } from "@softure-ai/jobs/server";
import { runDueJobs } from "@softure-ai/jobs/testing";
import { fakeFetch } from "@softure-ai/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { insertRepository } from "../../modules/projects/queries.ts";
import { createForgeClient } from "../../src/forge/client.ts";
import { createScanHandler } from "../../src/scan/scan-handler.ts";
import { SCAN_QUEUE } from "../../src/scan/scan-queue.ts";
import { NO_DOCTOR, NO_RELEASE, NO_RUNS, scanRoutes, TEST_FORGE_API } from "../support/fake-forge-routes.ts";
import { createStateFixture } from "../support/state-fixture.ts";
import { createTestContext, TEST_START, type TestContext } from "../support/test-context.ts";

describe("the scan schedule", () => {
  let context: TestContext;

  beforeEach(async () => {
    context = await createTestContext();
    await insertRepository(context.db, {
      key: "example-org/alpha-app",
      fullName: "example-org/alpha-app",
      defaultBranch: "main",
      hasState: true,
      missingPermissions: [],
      checkedAt: TEST_START,
    });
  });

  afterEach(async () => {
    await context.database.close();
  });

  it("scans once per period however often the jobs run, and again on Scan now", async () => {
    const forge = fakeFetch([
      ...scanRoutes("example-org/alpha-app", { state: { json: createStateFixture() }, issues: { json: [] }, release: NO_RELEASE, runs: NO_RUNS, doctor: NO_DOCTOR }).map((route) => ({
        ...route,
        repeat: true,
      })),
    ]);
    const client = createForgeClient({ token: "t", baseUrl: TEST_FORGE_API, fetch: forge.fetch });
    const handlers = { [SCAN_QUEUE]: createScanHandler(() => client) };

    await runDueJobs(context, { handlers });
    await runDueJobs(context, { handlers });
    expect(forge.calls).toHaveLength(6);

    await runScheduleNow(context, SCAN_QUEUE);
    await runDueJobs(context, { handlers });
    expect(forge.calls).toHaveLength(12);
  });

  it("fails the run without retries when no forge access is configured", async () => {
    const report = await runDueJobs(context, { handlers: { [SCAN_QUEUE]: createScanHandler(() => null) } });
    expect(report).toMatchObject({ succeeded: 0, failed: 1 });
  });
});
