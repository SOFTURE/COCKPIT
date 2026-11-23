import { fakeFetch, type FakeFetchRoute } from "@softure-ai/testing";
import { describe, expect, it } from "vitest";
import { createDeployAdapter } from "../../src/adapters/deploy/deploy-adapter.ts";
import { createForgeClient } from "../../src/forge/client.ts";
import { TEST_FORGE_API, type ScanAnswer } from "../support/fake-forge-routes.ts";
import { CLI_RELEASE_BODY, createReleaseBody, deployRun } from "../support/deploy-fixture.ts";

const PROJECT = { owner: "example-org", name: "kappa-app", branch: "main" };
const BASE = `${TEST_FORGE_API}/repos/example-org/kappa-app`;
const RUNS_URL = `${BASE}/actions/workflows/deploy.yml/runs?per_page=20`;
const RELEASES_URL = `${BASE}/releases?per_page=20`;
const RUN_URL = (id: number) => `https://github.com/example-org/kappa-app/actions/runs/${String(id)}`;

function readWith(runs: ScanAnswer, releases?: ScanAnswer) {
  const routes: FakeFetchRoute[] = [{ method: "GET", url: RUNS_URL, ...runs }];
  if (releases !== undefined) {
    routes.push({ method: "GET", url: RELEASES_URL, ...releases });
  }
  const forge = fakeFetch(routes);
  const client = createForgeClient({ token: "t", baseUrl: TEST_FORGE_API, fetch: forge.fetch });
  return { forge, read: () => createDeployAdapter().read({ client, project: PROJECT }) };
}

const runsAnswer = (...runs: unknown[]): ScanAnswer => ({ json: { total_count: runs.length, workflow_runs: runs } });
const releasesAnswer = (...releases: { tag: string; body: string | null }[]): ScanAnswer => ({
  json: releases.map((release) => ({ tag_name: release.tag, body: release.body })),
});

describe("the deploy adapter", () => {
  it("is absent for a project without a deploy workflow, reading nothing else", async () => {
    const { forge, read } = readWith({ status: 404, json: { message: "Not Found" } });
    await expect(read()).resolves.toEqual({ status: "absent" });
    expect(forge.calls).toHaveLength(1);
  });

  it("is absent while the deploy workflow never ran", async () => {
    const { forge, read } = readWith(runsAnswer());
    await expect(read()).resolves.toEqual({ status: "absent" });
    expect(forge.calls).toHaveLength(1);
  });

  it.each([
    ["refused", { status: 403, json: { message: "Resource not accessible by personal access token" } }, "runs_unreadable"],
    ["unavailable", { status: 502, json: { message: "Bad gateway" } }, "runs_unreadable"],
    ["not a list of runs", { json: { runs: "nope" } }, "runs_invalid"],
  ] as const)("is unknown when the runs are %s", async (_label, answer, reason) => {
    const { read } = readWith(answer);
    await expect(read()).resolves.toEqual({ status: "unknown", reason });
  });

  it("passes a forge rate limit on, so the scan stops", async () => {
    const { read } = readWith({ status: 429, json: { message: "slow down" }, headers: { "retry-after": "30" } });
    await expect(read()).resolves.toEqual({ status: "rate_limited", retryAfterSeconds: 30 });
  });

  it("names the tag of a passed release run when no release report exists", async () => {
    const run = deployRun({ id: 31, event: "release", headBranch: "v2.0.0", createdAt: "2026-11-20T08:00:00Z", htmlUrl: RUN_URL(31) });
    const { read } = readWith(runsAnswer(run), releasesAnswer({ tag: "v2.0.0", body: "Notes only." }));
    await expect(read()).resolves.toEqual({
      status: "value",
      value: {
        production: { version: "v2.0.0", at: "2026-11-20T08:00:00Z" },
        last: { result: "passed", version: "v2.0.0", verify: null, failedStep: null, url: RUN_URL(31), at: "2026-11-20T08:00:00Z" },
      },
    });
  });

  it("reads a failed redeploy from its report row while production keeps the earlier deploy", async () => {
    const runs = runsAnswer(
      deployRun({ id: 501, event: "release", headBranch: "v1.4.0", createdAt: "2026-11-10T09:00:00Z", htmlUrl: RUN_URL(501) }),
      deployRun({ id: 507, event: "workflow_dispatch", headBranch: "main", conclusion: "failure", createdAt: "2026-11-12T09:50:00Z", htmlUrl: RUN_URL(507) }),
    );
    const { read } = readWith(runs, releasesAnswer({ tag: "v1.4.0", body: CLI_RELEASE_BODY }));
    await expect(read()).resolves.toEqual({
      status: "value",
      value: {
        production: { version: "v1.4.0", at: "2026-11-10T09:12:00Z" },
        last: { result: "failed", version: "v1.4.0", verify: "skipped", failedStep: "migrate", url: RUN_URL(507), at: "2026-11-12T09:50:00Z" },
      },
    });
  });

  it("takes production from the newest deployed production row across releases, never from staging", async () => {
    const runs = runsAnswer(deployRun({ id: 40, event: "workflow_dispatch", headBranch: "main", createdAt: "2026-11-21T10:00:00Z", htmlUrl: RUN_URL(40) }));
    const releases = releasesAnswer(
      { tag: "v3.1.0", body: createReleaseBody([{ when: "2026-11-21 10:05", result: "deployed", environment: "staging", verify: "success", runUrl: RUN_URL(40) }]) },
      { tag: "v3.0.0", body: createReleaseBody([{ when: "2026-11-15 12:00", result: "deployed", verify: "success", runUrl: RUN_URL(35) }]) },
      { tag: "v2.9.0", body: null },
    );
    const { read } = readWith(runs, releases);
    await expect(read()).resolves.toMatchObject({
      status: "value",
      value: { production: { version: "v3.0.0", at: "2026-11-15T12:00:00Z" }, last: { result: "passed", version: "v3.1.0", verify: "passed" } },
    });
  });

  it("shows a running deploy without a verification yet", async () => {
    const runs = runsAnswer(
      deployRun({ id: 51, event: "release", headBranch: "v1.1.0", status: "in_progress", createdAt: "2026-11-22T10:00:00Z", htmlUrl: RUN_URL(51) }),
      deployRun({ id: 50, event: "release", headBranch: "v1.0.0", createdAt: "2026-11-21T10:00:00Z", htmlUrl: RUN_URL(50) }),
    );
    const { read } = readWith(runs, releasesAnswer());
    await expect(read()).resolves.toEqual({
      status: "value",
      value: {
        production: { version: "v1.0.0", at: "2026-11-21T10:00:00Z" },
        last: { result: "running", version: "v1.1.0", verify: null, failedStep: null, url: RUN_URL(51), at: "2026-11-22T10:00:00Z" },
      },
    });
  });

  it("answers from the runs alone when the releases cannot be read", async () => {
    const runs = runsAnswer(deployRun({ id: 60, event: "workflow_dispatch", headBranch: "main", conclusion: "cancelled", createdAt: "2026-11-22T10:00:00Z", htmlUrl: RUN_URL(60) }));
    const { read } = readWith(runs, { status: 403, json: { message: "Forbidden" } });
    await expect(read()).resolves.toEqual({
      status: "value",
      value: { production: null, last: { result: "cancelled", version: null, verify: null, failedStep: null, url: RUN_URL(60), at: "2026-11-22T10:00:00Z" } },
    });
  });
});
