import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findFires, findRoutines, type FireIssue } from "../../modules/projects/routines.ts";
import { addProjectRoutine, type ManageContext } from "../../src/routines/manage-routines.ts";
import { createTokenBox } from "../../src/routines/token-box.ts";
import {
  DEFAULT_RETRY_AFTER_SECONDS,
  drainQueuedFires,
  MAX_RATE_LIMITED_ATTEMPTS,
  retryIssueWakeByNumber,
  STALE_FIRE_MS,
  wakeAfterIssue,
  wakeIssue,
  type WakeDependencies,
} from "../../src/routines/wake-issue.ts";
import { captureLogs, type CapturedLogs } from "../support/capture-logs.ts";
import { createTestContext, type TestContext } from "../support/test-context.ts";
import { createFakeRoutinesApi, type FakeRoutinesApi } from "./fake-routines-api.ts";

const ALPHA = "example-org/alpha-app";
const BETA = "example-org/beta-app";
const SECRET = "fictional-routine-token-secret-0001";
const TOKEN = "fictional-routine-token-9q8w";

function issue(repositoryKey: string, number = 4): FireIssue {
  return { repositoryKey, fullName: repositoryKey, number, url: `https://forge.example.test/${repositoryKey}/issues/${String(number)}`, title: "COCKPIT command: Run the doctor" };
}

describe("waking a project", () => {
  let context: TestContext;
  let api: FakeRoutinesApi;
  let deps: WakeDependencies;
  let logs: CapturedLogs;

  async function addRoutine(repositoryKey: string, triggerId: string, values: { kind?: string; enabled?: boolean } = {}) {
    const manage: ManageContext = { db: context.db, clock: context.clock, box: deps.box };
    const added = await addProjectRoutine(manage, { repositoryKey, name: `Routine ${triggerId}`, kind: values.kind ?? "", trigger: triggerId, token: TOKEN, enabled: values.enabled ?? true });
    if (!added.ok) {
      throw new Error(`addRoutine: ${added.error}`);
    }
    return added.value.id;
  }

  async function firesOf(repositoryKey: string, number = 4) {
    const fires = await findFires(context.db, [{ repositoryKey, issueNumber: number }]);
    return fires.ok ? fires.value : [];
  }

  beforeEach(async () => {
    context = await createTestContext();
    api = createFakeRoutinesApi();
    deps = { db: context.db, clock: context.clock, api, box: createTokenBox(SECRET) };
    logs = captureLogs();
  });

  afterEach(async () => {
    logs.restore();
    await context.database.close();
  });

  it("fires every enabled cockpit-issues routine of the project once, with the issue's text, and records each as sent", async () => {
    await addRoutine(ALPHA, "trig_a1");
    await addRoutine(ALPHA, "trig_a2");
    await addRoutine(ALPHA, "trig_off", { enabled: false });
    await addRoutine(ALPHA, "trig_other", { kind: "reports" });
    await addRoutine(BETA, "trig_b1");

    expect(await wakeIssue(deps, issue(ALPHA))).toEqual({ ok: true, value: { sent: 2, failed: 0, queued: 0, noRoutine: false } });
    // Waking the same issue again fires nothing more.
    expect(await wakeIssue(deps, issue(ALPHA))).toEqual({ ok: true, value: { sent: 2, failed: 0, queued: 0, noRoutine: false } });

    expect(api.calls.map((call) => call.triggerId)).toEqual(["trig_a1", "trig_a2"]);
    expect(api.calls.every((call) => call.token === TOKEN)).toBe(true);
    expect(api.calls[0]?.text).toBe(`COCKPIT command: https://github.com/${ALPHA}/issues/4`);
    expect((await firesOf(ALPHA)).map((fire) => [fire.routineName, fire.status, fire.httpStatus])).toEqual([
      ["Routine trig_a1", "sent", 200],
      ["Routine trig_a2", "sent", 200],
    ]);
    const routines = await findRoutines(context.db, ALPHA);
    expect(routines.ok && routines.value.filter((routine) => routine.lastFireOk === true).map((routine) => routine.triggerId)).toEqual(["trig_a1", "trig_a2"]);
  });

  it("records no routine for a project without one, and Retry fires a routine added since", async () => {
    expect(await wakeIssue(deps, issue(BETA))).toEqual({ ok: true, value: { sent: 0, failed: 0, queued: 0, noRoutine: true } });
    expect(api.calls).toEqual([]);

    await addRoutine(BETA, "trig_b1");
    expect(await retryIssueWakeByNumber(deps, BETA, 4)).toEqual({ ok: true, value: { sent: 1, failed: 0, queued: 0, noRoutine: false } });
    expect((await firesOf(BETA)).map((fire) => fire.status)).toEqual(["sent"]);
  });

  it("keeps a failed fire with its status and reason, and Retry fires only that one again", async () => {
    await addRoutine(ALPHA, "trig_a1");
    await addRoutine(ALPHA, "trig_a2");
    api.script("trig_a2", { ok: false, status: 401, reason: "unauthorized", retryAfterSeconds: null });

    expect(await wakeIssue(deps, issue(ALPHA))).toEqual({ ok: true, value: { sent: 1, failed: 1, queued: 0, noRoutine: false } });
    expect((await firesOf(ALPHA)).map((fire) => [fire.status, fire.httpStatus, fire.reason])).toEqual([
      ["sent", 200, null],
      ["failed", 401, "unauthorized"],
    ]);

    expect(await retryIssueWakeByNumber(deps, ALPHA, 4)).toEqual({ ok: true, value: { sent: 2, failed: 0, queued: 0, noRoutine: false } });
    expect(api.calls.map((call) => call.triggerId)).toEqual(["trig_a1", "trig_a2", "trig_a2"]);
    expect(await retryIssueWakeByNumber(deps, ALPHA, 99)).toEqual({ ok: false, error: "wake.issue_unknown" });
  });

  it("queues a 429 for its retry-after and drains it when the time comes, giving up after the last attempt", async () => {
    await addRoutine(ALPHA, "trig_a1");
    const limited = { ok: false, status: 429, reason: "rate_limited", retryAfterSeconds: null } as const;
    api.script("trig_a1", { ...limited, retryAfterSeconds: 30 }, ...Array.from({ length: MAX_RATE_LIMITED_ATTEMPTS }, () => limited));

    expect(await wakeIssue(deps, issue(ALPHA))).toEqual({ ok: true, value: { sent: 0, failed: 0, queued: 1, noRoutine: false } });
    const [queued] = await firesOf(ALPHA);
    expect(queued).toMatchObject({ status: "queued", httpStatus: 429, reason: "rate_limited", attempts: 1 });
    expect(queued?.nextAttemptAt?.getTime()).toBe(context.clock.now().getTime() + 30_000);

    // Not due yet: nothing fires.
    expect(await drainQueuedFires(deps)).toEqual({ ok: true, value: 0 });
    for (let attempt = 2; attempt <= MAX_RATE_LIMITED_ATTEMPTS; attempt += 1) {
      context.clock.advance(DEFAULT_RETRY_AFTER_SECONDS * 1000);
      expect(await drainQueuedFires(deps)).toEqual({ ok: true, value: 1 });
    }
    expect((await firesOf(ALPHA)).map((fire) => [fire.status, fire.httpStatus, fire.reason, fire.attempts])).toEqual([["failed", 429, "rate_limited", MAX_RATE_LIMITED_ATTEMPTS]]);
    context.clock.advance(DEFAULT_RETRY_AFTER_SECONDS * 1000);
    expect(await drainQueuedFires(deps)).toEqual({ ok: true, value: 0 });
    expect(api.calls).toHaveLength(MAX_RATE_LIMITED_ATTEMPTS);
  });

  it("queues instead of calling once a routine's or the account's hourly limit is reached", async () => {
    deps = { ...deps, limits: { perRoutine: 2, total: 3, windowMs: 60 * 60_000 } };
    await addRoutine(ALPHA, "trig_a1");
    await addRoutine(BETA, "trig_b1");

    for (const number of [1, 2, 3]) {
      await wakeIssue(deps, issue(ALPHA, number));
    }
    await wakeIssue(deps, issue(BETA, 1));
    await wakeIssue(deps, issue(BETA, 2));

    expect(api.calls.map((call) => call.triggerId)).toEqual(["trig_a1", "trig_a1", "trig_b1"]);
    expect((await firesOf(ALPHA, 3))[0]).toMatchObject({ status: "queued", reason: "limit", httpStatus: null });
    expect((await firesOf(BETA, 2))[0]).toMatchObject({ status: "queued", reason: "limit" });

    // An hour later the queue drains.
    context.clock.advance(60 * 60_000);
    expect(await drainQueuedFires(deps)).toEqual({ ok: true, value: 2 });
    expect(api.calls).toHaveLength(5);
  });

  it("takes over a fire left sending by a request that died", async () => {
    await addRoutine(ALPHA, "trig_a1");
    const { claimFire } = await import("../../modules/projects/routines.ts");
    const routines = await findRoutines(context.db, ALPHA);
    const routine = routines.ok ? routines.value[0] : undefined;
    await claimFire(context.db, issue(ALPHA), { id: routine?.id ?? 0, name: routine?.name ?? "" }, context.clock.now());

    expect(await drainQueuedFires(deps)).toEqual({ ok: true, value: 0 });
    context.clock.advance(STALE_FIRE_MS);
    expect(await drainQueuedFires(deps)).toEqual({ ok: true, value: 1 });
    expect((await firesOf(ALPHA)).map((fire) => fire.status)).toEqual(["sent"]);
  });

  it("fails every fire as secret_missing without ROUTINE_TOKEN_SECRET, and token_unreadable under another secret", async () => {
    await addRoutine(ALPHA, "trig_a1");

    await wakeIssue({ ...deps, box: null }, issue(ALPHA, 1));
    await wakeIssue({ ...deps, box: createTokenBox("another-fictional-secret-of-32-chars") }, issue(ALPHA, 2));

    expect(api.calls).toEqual([]);
    expect((await firesOf(ALPHA, 1))[0]).toMatchObject({ status: "failed", reason: "secret_missing" });
    expect((await firesOf(ALPHA, 2))[0]).toMatchObject({ status: "failed", reason: "token_unreadable" });
  });

  it("never fails the caller: without dependencies nothing happens, and a storage failure is logged", async () => {
    expect(await wakeAfterIssue(null, issue(ALPHA))).toBeNull();
    await context.database.close();
    expect(await wakeAfterIssue(deps, issue(ALPHA))).toBeNull();
    expect(logs.find("routines: waking a project failed")).toHaveLength(1);
    context = await createTestContext();
  });

  it("puts no token in a log line, a stored row or an error", async () => {
    await addRoutine(ALPHA, "trig_a1");
    await addRoutine(ALPHA, "trig_a2");
    api.script("trig_a2", { ok: false, status: 503, reason: "server_error", retryAfterSeconds: null });
    await wakeIssue(deps, issue(ALPHA));
    await retryIssueWakeByNumber(deps, ALPHA, 4);

    expect(logs.lines().length).toBeGreaterThan(0);
    expect(logs.lines().join("\n")).not.toContain(TOKEN);
    expect(JSON.stringify(await firesOf(ALPHA))).not.toContain(TOKEN);
    const stored = await findRoutines(context.db, ALPHA);
    expect(JSON.stringify(stored)).not.toContain(TOKEN);
    expect(stored.ok && stored.value.map((routine) => routine.tokenLast4)).toEqual(["9q8w", "9q8w"]);
  });
});
