import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { addRoutine as storeRoutine, findFires, findRoutines, type FireIssue } from "../../../modules/projects/routines.ts";
import { addProjectRoutine, testRoutine, type ManageContext } from "../../../src/routines/manage-routines.ts";
import type { ProviderFireRequest, RoutineProvider } from "../../../src/routines/providers/contract.ts";
import { buildRoutinesTab } from "../../../src/routines/routines-tab.ts";
import { createTokenBox } from "../../../src/routines/token-box.ts";
import { wakeIssue, type WakeDependencies } from "../../../src/routines/wake-issue.ts";
import { captureLogs, type CapturedLogs } from "../../support/capture-logs.ts";
import { createTestContext, type TestContext } from "../../support/test-context.ts";
import { createFakeProviders, createFakeRoutinesApi, type FakeRoutinesApi } from "../fake-routines-api.ts";

const ALPHA = "example-org/alpha-app";
const TOKEN = "fictional-hook-token-h7k3";
const box = createTokenBox("fictional-routine-token-secret-0001");

/** A provider that exists only in this test: a webhook address and a token, its calls recorded. */
function createFakeWebhookProvider(calls: ProviderFireRequest[]): RoutineProvider {
  return {
    id: "fake-webhook",
    fields: ["address"],
    parseSettings: (input) => {
      const address = input.address?.trim() ?? "";
      return address.startsWith("https://") ? { address } : null;
    },
    readSettings: (stored) =>
      typeof stored === "object" && stored !== null && "address" in stored && typeof stored.address === "string" && stored.address.startsWith("https://")
        ? { address: stored.address }
        : null,
    describe: (settings) => settings.address ?? "",
    fire: (request) => {
      calls.push(request);
      return Promise.resolve({ ok: true, status: 202 });
    },
  };
}

const ISSUE: FireIssue = { repositoryKey: ALPHA, fullName: ALPHA, number: 9, url: `https://forge.example.test/${ALPHA}/issues/9`, title: "COCKPIT command: Run the doctor" };

describe("routines through a provider adapter (CT-20)", () => {
  let context: TestContext;
  let api: FakeRoutinesApi;
  let hookCalls: ProviderFireRequest[];
  let manage: ManageContext;
  let deps: WakeDependencies;
  let logs: CapturedLogs;

  beforeEach(async () => {
    context = await createTestContext();
    api = createFakeRoutinesApi();
    hookCalls = [];
    const providers = createFakeProviders(api, createFakeWebhookProvider(hookCalls));
    manage = { db: context.db, clock: context.clock, box, providers };
    deps = { db: context.db, clock: context.clock, box, providers };
    logs = captureLogs();
  });

  afterEach(async () => {
    logs.restore();
    await context.database.close();
  });

  it("adds, tests and fires a routine of a second provider registered only in the test, beside a Claude Code one", async () => {
    const hook = await addProjectRoutine(manage, { repositoryKey: ALPHA, name: "Hook", kind: "", provider: "fake-webhook", settings: { address: " https://hooks.example.test/a " }, token: TOKEN, enabled: true });
    await addProjectRoutine(manage, { repositoryKey: ALPHA, name: "Coordinator", kind: "", provider: "claude-code", settings: { triggerId: "trig_01Alpha" }, token: TOKEN, enabled: true });

    expect(await addProjectRoutine(manage, { repositoryKey: ALPHA, name: "Bad", kind: "", provider: "fake-webhook", settings: { address: "ftp://x" }, token: TOKEN, enabled: true })).toEqual({
      ok: false,
      error: "routines.settings_invalid",
    });
    expect(await testRoutine(manage, ALPHA, hook.ok ? hook.value.id : 0)).toEqual({ ok: true, value: { kind: "sent", status: 202 } });
    const woke = await wakeIssue(deps, ISSUE);

    expect(woke).toEqual({ ok: true, value: { sent: 2, failed: 0, queued: 0, noRoutine: false } });
    expect(hookCalls.map((call) => [call.settings, call.text])).toEqual([
      [{ address: "https://hooks.example.test/a" }, "COCKPIT test: reply in this chat that the test arrived; change nothing."],
      [{ address: "https://hooks.example.test/a" }, `COCKPIT command: https://github.com/${ALPHA}/issues/9`],
    ]);
    expect(api.calls.map((call) => call.triggerId)).toEqual(["trig_01Alpha"]);
    const routines = await findRoutines(context.db, ALPHA);
    const tab = buildRoutinesTab({ routines: routines.ok ? routines.value : [], fires: [], canStore: true, now: new Date(), providers: manage.providers });
    expect(tab.routines.map((routine) => [routine.provider, routine.target])).toEqual([
      ["fake-webhook", "https://hooks.example.test/a"],
      ["claude-code", "trig_01Alpha"],
    ]);
    expect(logs.lines().join("\n")).not.toContain(TOKEN);
  });

  it("fails the fire of a routine whose provider is gone or whose settings do not read, without calling anything", async () => {
    const at = context.clock.now();
    const sealed = { tokenCiphertext: box.seal(TOKEN), tokenLast4: "h7k3", enabled: true, at };
    await storeRoutine(context.db, { ...sealed, repositoryKey: ALPHA, name: "Gone", kind: "cockpit-issues", provider: "retired-provider", settings: {} });
    await storeRoutine(context.db, { ...sealed, repositoryKey: ALPHA, name: "Broken", kind: "cockpit-issues", provider: "fake-webhook", settings: { address: "" } });

    await wakeIssue(deps, ISSUE);

    const fires = await findFires(context.db, [{ repositoryKey: ALPHA, issueNumber: 9 }]);
    expect(fires.ok && fires.value.map((fire) => [fire.routineName, fire.status, fire.reason])).toEqual([
      ["Gone", "failed", "provider_unknown"],
      ["Broken", "failed", "settings_invalid"],
    ]);
    expect(hookCalls).toEqual([]);
    expect(api.calls).toEqual([]);
  });

  it("refuses a Claude Code routine without a valid trigger id in the database itself", async () => {
    const stored = await storeRoutine(context.db, {
      repositoryKey: ALPHA,
      name: "Bad",
      kind: "cockpit-issues",
      provider: "claude-code",
      settings: { triggerId: "../../v1/messages" },
      tokenCiphertext: box.seal(TOKEN),
      tokenLast4: "h7k3",
      enabled: true,
      at: context.clock.now(),
    });

    expect(stored.ok).toBe(false);
  });
});
