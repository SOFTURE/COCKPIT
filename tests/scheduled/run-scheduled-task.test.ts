import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { claimSend, findBroadcasts, findSends, saveBroadcast } from "../../modules/projects/broadcasts.ts";
import { deleteRepository, insertRepository } from "../../modules/projects/queries.ts";
import { claimDueScheduledTasks, findScheduledTask } from "../../modules/projects/scheduled-tasks.ts";
import { parseBroadcastMarker } from "../../src/broadcast/broadcast-marker.ts";
import { createForgeClient } from "../../src/forge/client.ts";
import { formatBroadcastIssue } from "../../src/forge/issues.ts";
import { addProjectRoutine } from "../../src/routines/manage-routines.ts";
import { createTokenBox } from "../../src/routines/token-box.ts";
import type { WakeDependencies } from "../../src/routines/wake-issue.ts";
import { runDueScheduledTasks, runScheduledTaskNow, STALE_RUN_MS, type ScheduledRunDependencies } from "../../src/scheduled/run-scheduled-task.ts";
import { createScheduledTask } from "../../src/scheduled/save-scheduled-task.ts";
import { TEST_FORGE_API } from "../support/fake-forge-routes.ts";
import { createMemoryForges, type MemoryForges } from "../support/memory-forge.ts";
import { createTestContext, TEST_START, type TestContext } from "../support/test-context.ts";
import { createFakeProviders, createFakeRoutinesApi, type FakeRoutinesApi } from "../routines/fake-routines-api.ts";

const ZONE = "Europe/Warsaw";
const TASK_ID = "6c3f1d2a-8b4e-4c1a-9e7f-0a1b2c3d4e5f";
const PROJECTS = ["example-org/alpha-app", "example-org/beta-app"] as const;
const [ALPHA, BETA] = PROJECTS;
const PROMPT = "Run the quality review on the main branch and report the findings.";
const MINUTE = 60_000;
// TEST_START is 2026-11-02T09:00:00Z (10:00 in Warsaw); the task is planned for 10:05 local.
const RUN_AT_LOCAL = "2026-11-02T10:05";
const RUN_AT = new Date("2026-11-02T09:05:00Z");

describe("firing scheduled tasks", () => {
  let context: TestContext;
  let forges: MemoryForges;
  let api: FakeRoutinesApi;
  let wake: WakeDependencies;
  let deps: ScheduledRunDependencies;

  /** Issues each project holds that carry a broadcast marker and the cockpit label. */
  function markedIssues(fullName: string) {
    return forges.get(fullName).issues.filter((issue) => issue.labels.includes("cockpit") && parseBroadcastMarker(issue.body) !== null);
  }

  async function storedTask() {
    const task = await findScheduledTask(context.db, TASK_ID);
    if (!task.ok || task.value === null) {
      throw new Error("storedTask: the task is gone");
    }
    return task.value;
  }

  async function schedule(repositoryKeys: readonly string[] = PROJECTS) {
    const saved = await createScheduledTask(
      { db: context.db, clock: context.clock, timeZone: ZONE },
      { id: TASK_ID, title: "Check code quality", prompt: PROMPT, runAt: RUN_AT_LOCAL, repositoryKeys, createdBy: "user-1", createdByName: "Ada Example" },
    );
    if (!saved.ok) {
      throw new Error(`schedule: ${saved.error}`);
    }
  }

  beforeEach(async () => {
    context = await createTestContext();
    forges = createMemoryForges(PROJECTS, () => context.clock.now());
    for (const fullName of PROJECTS) {
      await insertRepository(context.db, { key: fullName, fullName, defaultBranch: "main", hasState: true, missingPermissions: [], checkedAt: TEST_START });
    }
    api = createFakeRoutinesApi();
    wake = { db: context.db, clock: context.clock, providers: createFakeProviders(api), box: createTokenBox("fictional-routine-token-secret-0001") };
    deps = {
      db: context.db,
      client: createForgeClient({ token: "test-token", baseUrl: TEST_FORGE_API, fetch: forges.fetch }),
      clock: context.clock,
      wake,
    };
  });

  afterEach(async () => {
    await context.database.close();
  });

  it("leaves a task alone before its time", async () => {
    await schedule();
    context.clock.set(new Date(RUN_AT.getTime() - 1));

    expect(await runDueScheduledTasks(deps)).toEqual({ ok: true, value: 0 });
    expect(markedIssues(ALPHA)).toHaveLength(0);
    expect((await storedTask()).status).toBe("scheduled");
  });

  it("fires a due task once: one issue per project with the marker and the prompt, recorded on the task", async () => {
    await schedule();
    context.clock.set(RUN_AT);

    expect(await runDueScheduledTasks(deps)).toEqual({ ok: true, value: 1 });
    context.clock.advance(MINUTE);
    expect(await runDueScheduledTasks(deps)).toEqual({ ok: true, value: 0 });

    const task = await storedTask();
    expect(task).toMatchObject({ status: "sent", runAt: RUN_AT, sentAt: RUN_AT, skippedKeys: [], failure: null });
    for (const fullName of PROJECTS) {
      const issues = markedIssues(fullName);
      expect(issues).toHaveLength(1);
      expect(parseBroadcastMarker(issues[0]?.body ?? "")?.id).toBe(task.broadcastId);
      expect(issues[0]?.title).toBe("COCKPIT command: Check code quality");
      expect(issues[0]?.body).toContain(`> ${PROMPT}`);
      expect(issues[0]?.body).toContain("**Ada Example**");
    }
    const broadcasts = await findBroadcasts(context.db);
    expect(broadcasts.ok && broadcasts.value.map((broadcast) => broadcast.id)).toEqual([task.broadcastId]);
  });

  it("fires a task whose time passed while the worker was down and records both times", async () => {
    await schedule();
    const late = new Date(RUN_AT.getTime() + 3 * 60 * MINUTE);
    context.clock.set(late);

    expect(await runDueScheduledTasks(deps)).toEqual({ ok: true, value: 1 });
    expect(await storedTask()).toMatchObject({ status: "sent", runAt: RUN_AT, sentAt: late });
  });

  it("fires once when two ticks run at the same time", async () => {
    await schedule();
    context.clock.set(RUN_AT);

    const [first, second] = await Promise.all([runDueScheduledTasks(deps), runDueScheduledTasks(deps)]);

    expect((first.ok ? first.value : -1) + (second.ok ? second.value : -1)).toBe(1);
    for (const fullName of PROJECTS) {
      expect(markedIssues(fullName)).toHaveLength(1);
    }
    expect((await storedTask()).status).toBe("sent");
  });

  it("takes over a run a dead worker left sending without a second issue", async () => {
    await schedule();
    context.clock.set(RUN_AT);
    // A worker claims the task, stores the broadcast, creates ALPHA's issue and dies before recording it.
    const claimed = await claimDueScheduledTasks(context.db, { at: RUN_AT, staleBefore: new Date(0), limit: 1 });
    const broadcastId = claimed.ok ? (claimed.value[0]?.broadcastId ?? "") : "";
    await saveBroadcast(context.db, { id: broadcastId, title: "Check code quality", body: PROMPT, sentBy: "user-1", sentByName: "Ada Example", createdAt: RUN_AT });
    await claimSend(context.db, { broadcastId, repositoryKey: ALPHA, fullName: ALPHA, at: RUN_AT });
    const issue = formatBroadcastIssue({ id: broadcastId, title: "Check code quality", body: PROMPT, sentBy: "Ada Example" });
    forges.get(ALPHA).issues.push({ number: 1, title: issue.title, body: issue.body, labels: ["cockpit"], state: "open", createdAt: RUN_AT.toISOString() });

    context.clock.set(new Date(RUN_AT.getTime() + STALE_RUN_MS - 1));
    expect(await runDueScheduledTasks(deps)).toEqual({ ok: true, value: 0 });
    const takeover = new Date(RUN_AT.getTime() + STALE_RUN_MS);
    context.clock.set(takeover);
    expect(await runDueScheduledTasks(deps)).toEqual({ ok: true, value: 1 });

    expect(markedIssues(ALPHA)).toHaveLength(1);
    expect(markedIssues(BETA)).toHaveLength(1);
    expect(await storedTask()).toMatchObject({ status: "sent", broadcastId, sentAt: takeover });
    const sends = await findSends(context.db, broadcastId);
    expect(sends.ok && sends.value.map((send) => [send.repositoryKey, send.status, send.issueNumber])).toEqual([
      [ALPHA, "sent", 1],
      [BETA, "sent", 1],
    ]);
  });

  it("runs a scheduled task now once, and refuses a second run", async () => {
    await schedule();

    const ran = await runScheduledTaskNow(deps, TASK_ID);
    const again = await runScheduledTaskNow(deps, TASK_ID);

    const task = await storedTask();
    expect(ran).toEqual({ ok: true, value: { kind: "sent", broadcastId: task.broadcastId, skippedKeys: [] } });
    expect(again).toEqual({ ok: false, error: "scheduled.not_scheduled" });
    expect(task).toMatchObject({ status: "sent", runAt: RUN_AT, sentAt: TEST_START });
    for (const fullName of PROJECTS) {
      expect(markedIssues(fullName)).toHaveLength(1);
    }
    context.clock.set(RUN_AT);
    expect(await runDueScheduledTasks(deps)).toEqual({ ok: true, value: 0 });
    expect(markedIssues(ALPHA)).toHaveLength(1);
  });

  it("refuses to run an unknown task now, or without a forge token", async () => {
    expect(await runScheduledTaskNow(deps, TASK_ID)).toEqual({ ok: false, error: "scheduled.not_found" });
    await schedule();
    expect(await runScheduledTaskNow({ ...deps, client: null }, TASK_ID)).toEqual({ ok: false, error: "scheduled.forge_not_configured" });
    expect((await storedTask()).status).toBe("scheduled");
  });

  it("skips a project unwatched since the task was saved and names it on the task", async () => {
    await schedule();
    await deleteRepository(context.db, BETA);
    context.clock.set(RUN_AT);

    await runDueScheduledTasks(deps);

    expect(await storedTask()).toMatchObject({ status: "sent", skippedKeys: [BETA] });
    expect(markedIssues(ALPHA)).toHaveLength(1);
    expect(markedIssues(BETA)).toHaveLength(0);
  });

  it("records a failed run when none of its projects is watched any more", async () => {
    await schedule([BETA]);
    await deleteRepository(context.db, BETA);
    context.clock.set(RUN_AT);

    await runDueScheduledTasks(deps);

    expect(await storedTask()).toMatchObject({ status: "failed", failure: "no_projects", skippedKeys: [BETA], sentAt: null });
    expect(markedIssues(BETA)).toHaveLength(0);
  });

  it("records a failed run when the worker has no forge token", async () => {
    await schedule();
    context.clock.set(RUN_AT);

    await runDueScheduledTasks({ ...deps, client: null });

    expect(await storedTask()).toMatchObject({ status: "failed", failure: "forge_not_configured" });
  });

  it("wakes the routines of each project once its issue exists", async () => {
    for (const [fullName, triggerId] of [[ALPHA, "trig_alpha"], [BETA, "trig_beta"]] as const) {
      const added = await addProjectRoutine(
        { db: context.db, clock: context.clock, box: wake.box, providers: wake.providers },
        { repositoryKey: fullName, name: `Routine ${triggerId}`, kind: "", provider: "claude-code", settings: { triggerId }, token: "fictional-routine-token-9q8w", enabled: true },
      );
      expect(added.ok).toBe(true);
    }
    await schedule();
    context.clock.set(RUN_AT);

    await runDueScheduledTasks(deps);

    expect(api.calls.map((call) => call.triggerId).sort()).toEqual(["trig_alpha", "trig_beta"]);
    expect(api.calls.map((call) => call.text).sort()).toEqual([
      `COCKPIT command: https://github.com/${ALPHA}/issues/1`,
      `COCKPIT command: https://github.com/${BETA}/issues/1`,
    ]);
  });
});
