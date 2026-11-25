import { fakeFetch } from "@softure-ai/testing";
import { describe, expect, it } from "vitest";
import { WAKE_ADAPTER_ID, WORKFLOW_FILE_PATH } from "../../src/adapters/wake/owner-word-wake.ts";
import { createWakeAdapter } from "../../src/adapters/wake/wake-adapter.ts";
import { getWakeView, isWakingOnItsOwn } from "../../src/adapters/wake/wake-view.ts";
import { createForgeClient } from "../../src/forge/client.ts";
import { TEST_FORGE_API, type ScanAnswer } from "../support/fake-forge-routes.ts";

const PROJECT = { owner: "example-org", name: "alpha-app", branch: "main" };
const WORKFLOW_URL = `${TEST_FORGE_API}/repos/example-org/alpha-app/contents/${WORKFLOW_FILE_PATH}?ref=main`;
const READ_AT = new Date("2026-11-24T08:00:00Z");

function readWith(answer: ScanAnswer) {
  const forge = fakeFetch([{ method: "GET", url: WORKFLOW_URL, ...answer }]);
  const client = createForgeClient({ token: "t", baseUrl: TEST_FORGE_API, fetch: forge.fetch });
  return { forge, read: () => createWakeAdapter().read({ client, project: PROJECT }) };
}

const workflow = (autonomy?: Record<string, unknown>): ScanAnswer => ({ json: { mode: "autonomous", ...(autonomy === undefined ? {} : { autonomy }) } });

describe("the wake adapter", () => {
  it("reads routine, heartbeat and none as the project declares them", async () => {
    for (const wake of ["routine", "heartbeat", "none"]) {
      await expect(readWith(workflow({ merge: "pr", ownerWordWake: wake })).read()).resolves.toEqual({ status: "value", value: { wake } });
    }
  });

  it("reads autonomy.cockpitWake of @softure-ai/skills 0.39 and newer, before the older ownerWordWake", async () => {
    await expect(readWith(workflow({ cockpitWake: "routine" })).read()).resolves.toEqual({ status: "value", value: { wake: "routine" } });
    await expect(readWith(workflow({ cockpitWake: "heartbeat", ownerWordWake: "routine" })).read()).resolves.toEqual({ status: "value", value: { wake: "heartbeat" } });
    await expect(readWith(workflow({ cockpitWake: "Routine" })).read()).resolves.toEqual({ status: "unknown", reason: "wake_invalid" });
  });

  it("reads a workflow without the key, or without autonomy, as undeclared", async () => {
    await expect(readWith(workflow({ merge: "pr" })).read()).resolves.toEqual({ status: "value", value: { wake: "undeclared" } });
    await expect(readWith(workflow()).read()).resolves.toEqual({ status: "value", value: { wake: "undeclared" } });
  });

  it("reads a value the doctor rejects as unknown, never as a wake-up", async () => {
    await expect(readWith(workflow({ ownerWordWake: true })).read()).resolves.toEqual({ status: "unknown", reason: "wake_invalid" });
    await expect(readWith(workflow({ ownerWordWake: "Routine" })).read()).resolves.toEqual({ status: "unknown", reason: "wake_invalid" });
  });

  it("reads a workflow file that is not an object as invalid", async () => {
    await expect(readWith({ json: ["not", "settings"] }).read()).resolves.toEqual({ status: "unknown", reason: "workflow_invalid" });
    await expect(readWith({ json: { autonomy: "pr" } }).read()).resolves.toEqual({ status: "unknown", reason: "workflow_invalid" });
  });

  it("is absent for a repository without a workflow file", async () => {
    await expect(readWith({ status: 404, json: { message: "Not Found" } }).read()).resolves.toEqual({ status: "absent" });
  });

  it("is unknown when the forge refuses the file", async () => {
    await expect(readWith({ status: 403, json: { message: "Resource not accessible" } }).read()).resolves.toEqual({
      status: "unknown",
      reason: "workflow_unreadable",
    });
  });

  it("stops the scan on a rate limit", async () => {
    const read = await readWith({ status: 429, json: { message: "slow down" }, headers: { "retry-after": "30" } }).read();
    expect(read).toEqual({ status: "rate_limited", retryAfterSeconds: 30 });
  });

  it("only reads the workflow file, with a GET", async () => {
    const { forge, read } = readWith(workflow({ ownerWordWake: "routine" }));
    await read();
    expect(forge.calls.map((call) => [call.method, call.url])).toEqual([["GET", WORKFLOW_URL]]);
  });
});

describe("getWakeView", () => {
  const at = { readAt: READ_AT };

  it("gives three fictional projects declaring routine, heartbeat and nothing three different views", () => {
    const reads = [
      { key: "example-org/routine-app", adapter: WAKE_ADAPTER_ID, status: "value" as const, value: { wake: "routine" }, ...at },
      { key: "example-org/heartbeat-app", adapter: WAKE_ADAPTER_ID, status: "value" as const, value: { wake: "heartbeat" }, ...at },
      { key: "example-org/quiet-app", adapter: WAKE_ADAPTER_ID, status: "value" as const, value: { wake: "undeclared" }, ...at },
    ];
    const views = ["routine-app", "heartbeat-app", "quiet-app"].map((name) => getWakeView(reads, `example-org/${name}`));
    expect(views).toEqual([
      { kind: "declared", wake: "routine" },
      { kind: "declared", wake: "heartbeat" },
      { kind: "declared", wake: "undeclared" },
    ]);
    expect(views.map(isWakingOnItsOwn)).toEqual([true, false, false]);
  });

  it("shows nothing without a read or for another adapter, and unknown for a garbled value or a new reason", () => {
    const reads = [
      { key: "example-org/other", adapter: "deploy", status: "value" as const, value: { wake: "routine" }, ...at },
      { key: "example-org/garbled", adapter: WAKE_ADAPTER_ID, status: "value" as const, value: { wake: "always" }, ...at },
      { key: "example-org/future", adapter: WAKE_ADAPTER_ID, status: "unknown" as const, reason: "from-the-future", ...at },
    ];
    expect(getWakeView(reads, "example-org/missing")).toEqual({ kind: "none" });
    expect(getWakeView(reads, "example-org/other")).toEqual({ kind: "none" });
    expect(getWakeView(reads, "example-org/garbled")).toEqual({ kind: "unknown", reason: "other" });
    expect(getWakeView(reads, "example-org/future")).toEqual({ kind: "unknown", reason: "other" });
  });
});
