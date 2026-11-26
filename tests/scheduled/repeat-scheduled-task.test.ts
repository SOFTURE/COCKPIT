import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { insertRepository } from "../../modules/projects/queries.ts";
import { claimDueScheduledTasks, findScheduledTasks, type StoredScheduledTask } from "../../modules/projects/scheduled-tasks.ts";
import { parseBroadcastMarker } from "../../src/broadcast/broadcast-marker.ts";
import { createForgeClient } from "../../src/forge/client.ts";
import { getNextRunAt } from "../../src/scheduled/next-run-at.ts";
import { setScheduledTaskPause } from "../../src/scheduled/pause-scheduled-task.ts";
import { runDueScheduledTasks, runScheduledTaskNow, type ScheduledRunDependencies } from "../../src/scheduled/run-scheduled-task.ts";
import { createScheduledTask, editScheduledTask } from "../../src/scheduled/save-scheduled-task.ts";
import { TEST_FORGE_API } from "../support/fake-forge-routes.ts";
import { createMemoryForges, type MemoryForges } from "../support/memory-forge.ts";
import { createTestContext, TEST_START, type TestContext } from "../support/test-context.ts";

const ZONE = "Europe/Warsaw";
const TASK_ID = "7d4e2a3b-9c5f-4d2b-8f80-1b2c3d4e5f60";
const PROJECTS = ["example-org/gamma-app", "example-org/delta-app"] as const;
const [GAMMA] = PROJECTS;
const MINUTE = 60_000;
const WEEK = 7 * 24 * 60 * MINUTE;
// TEST_START is Monday 2026-11-02T09:00:00Z (10:00 in Warsaw); the task is planned for 10:05 local every week.
const RUN_AT_LOCAL = "2026-11-02T10:05";
const RUN_AT = new Date("2026-11-02T09:05:00Z");

describe("repeating scheduled tasks", () => {
  let context: TestContext;
  let forges: MemoryForges;
  let deps: ScheduledRunDependencies;

  function markedIssues(fullName: string) {
    return forges.get(fullName).issues.filter((issue) => issue.labels.includes("cockpit") && parseBroadcastMarker(issue.body) !== null);
  }

  async function tasks(): Promise<StoredScheduledTask[]> {
    const all = await findScheduledTasks(context.db);
    if (!all.ok) {
      throw new Error("tasks: reading failed");
    }
    return all.value;
  }

  async function upcoming(): Promise<StoredScheduledTask[]> {
    return (await tasks()).filter((task) => task.status === "scheduled");
  }

  async function schedule(repeat: "daily" | "weekly" = "weekly") {
    const saved = await createScheduledTask(
      { db: context.db, clock: context.clock, timeZone: ZONE },
      { id: TASK_ID, title: "Check code quality", prompt: "Review the code.", runAt: RUN_AT_LOCAL, repositoryKeys: PROJECTS, repeat, createdBy: "user-1", createdByName: "Ada Example" },
    );
    if (!saved.ok) {
      throw new Error(`schedule: ${saved.error}`);
    }
  }

  const pauseContext = () => ({ db: context.db, clock: context.clock, timeZone: ZONE });

  beforeEach(async () => {
    context = await createTestContext();
    forges = createMemoryForges(PROJECTS, () => context.clock.now());
    for (const fullName of PROJECTS) {
      await insertRepository(context.db, { key: fullName, fullName, defaultBranch: "main", hasState: true, missingPermissions: [], checkedAt: TEST_START });
    }
    deps = {
      db: context.db,
      client: createForgeClient({ token: "test-token", baseUrl: TEST_FORGE_API, fetch: forges.fetch }),
      clock: context.clock,
      wake: null,
      timeZone: ZONE,
    };
  });

  afterEach(async () => {
    await context.database.close();
  });

  it("fires a weekly task, plans its next run a week later and fires that once: one issue per project per run", async () => {
    await schedule();
    context.clock.set(RUN_AT);

    expect(await runDueScheduledTasks(deps)).toEqual({ ok: true, value: 1 });
    const [next] = await upcoming();
    expect(next).toMatchObject({ runAt: new Date(RUN_AT.getTime() + WEEK), repeat: "weekly", seriesId: TASK_ID, title: "Check code quality" });
    context.clock.advance(MINUTE);
    expect(await runDueScheduledTasks(deps)).toEqual({ ok: true, value: 0 });

    context.clock.set(new Date(RUN_AT.getTime() + WEEK));
    expect(await runDueScheduledTasks(deps)).toEqual({ ok: true, value: 1 });
    context.clock.advance(MINUTE);
    expect(await runDueScheduledTasks(deps)).toEqual({ ok: true, value: 0 });

    const all = await tasks();
    const sent = all.filter((task) => task.status === "sent");
    expect(sent.map((task) => task.runAt)).toEqual([RUN_AT, new Date(RUN_AT.getTime() + WEEK)]);
    expect(new Set(sent.map((task) => task.broadcastId)).size).toBe(2);
    expect((await upcoming()).map((task) => task.runAt)).toEqual([new Date(RUN_AT.getTime() + 2 * WEEK)]);
    for (const fullName of PROJECTS) {
      const markers = markedIssues(fullName).map((issue) => parseBroadcastMarker(issue.body)?.id);
      expect(markers.sort()).toEqual(sent.map((task) => task.broadcastId).sort());
    }
  });

  it("plans one next run when two ticks claim at the same time", async () => {
    await schedule("daily");
    context.clock.set(RUN_AT);

    await Promise.all([runDueScheduledTasks(deps), runDueScheduledTasks(deps)]);

    expect((await upcoming()).map((task) => task.runAt)).toEqual([new Date(RUN_AT.getTime() + 24 * 60 * MINUTE)]);
    expect(markedIssues(GAMMA)).toHaveLength(1);
  });

  it("plans no second next run when a stale run is taken over", async () => {
    await schedule();
    const nextRunAt = (task: Pick<StoredScheduledTask, "runAt" | "repeat">, now: Date) =>
      getNextRunAt({ plannedAt: task.runAt, repeat: task.repeat, now, timeZone: ZONE });
    await claimDueScheduledTasks(context.db, { at: RUN_AT, staleBefore: new Date(0), limit: 5, getNextRunAt: nextRunAt });
    const later = new Date(RUN_AT.getTime() + 30 * MINUTE);

    const takeover = await claimDueScheduledTasks(context.db, { at: later, staleBefore: later, limit: 5, getNextRunAt: nextRunAt });

    expect(takeover.ok && takeover.value.map((task) => task.id)).toEqual([TASK_ID]);
    expect((await upcoming()).map((task) => task.runAt)).toEqual([new Date(RUN_AT.getTime() + WEEK)]);
  });

  it("fires a run missed by several weeks once and plans the next one after now", async () => {
    await schedule();
    const late = new Date(RUN_AT.getTime() + 3 * WEEK + 60 * MINUTE);
    context.clock.set(late);

    expect(await runDueScheduledTasks(deps)).toEqual({ ok: true, value: 1 });
    context.clock.advance(MINUTE);
    expect(await runDueScheduledTasks(deps)).toEqual({ ok: true, value: 0 });

    expect((await upcoming()).map((task) => task.runAt)).toEqual([new Date(RUN_AT.getTime() + 4 * WEEK)]);
    expect(markedIssues(GAMMA)).toHaveLength(1);
  });

  it("runs a repeating task now as a copy and keeps its next planned run", async () => {
    await schedule();

    const ran = await runScheduledTaskNow(deps, TASK_ID);

    expect(ran.ok && ran.value.kind).toBe("sent");
    const all = await tasks();
    expect(all.find((task) => task.id === TASK_ID)).toMatchObject({ status: "scheduled", runAt: RUN_AT, repeat: "weekly" });
    const copy = all.find((task) => task.id !== TASK_ID);
    expect(copy).toMatchObject({ status: "sent", runAt: TEST_START, repeat: "none", seriesId: TASK_ID });
    expect(markedIssues(GAMMA)).toHaveLength(1);
  });

  it("does not fire a paused task, shows it paused, and fires it again once resumed", async () => {
    await schedule();
    expect(await setScheduledTaskPause(pauseContext(), TASK_ID, true)).toEqual({ ok: true, value: undefined });
    context.clock.set(RUN_AT);

    expect(await runDueScheduledTasks(deps)).toEqual({ ok: true, value: 0 });
    expect(await upcoming()).toMatchObject([{ id: TASK_ID, paused: true, runAt: RUN_AT }]);

    // Resumed after its time passed: the paused run is skipped and the series goes on a week later.
    context.clock.set(new Date(RUN_AT.getTime() + 60 * MINUTE));
    expect(await setScheduledTaskPause(pauseContext(), TASK_ID, false)).toEqual({ ok: true, value: undefined });
    expect(await upcoming()).toMatchObject([{ id: TASK_ID, paused: false, runAt: new Date(RUN_AT.getTime() + WEEK) }]);
    expect(await runDueScheduledTasks(deps)).toEqual({ ok: true, value: 0 });

    context.clock.set(new Date(RUN_AT.getTime() + WEEK));
    expect(await runDueScheduledTasks(deps)).toEqual({ ok: true, value: 1 });
    expect(markedIssues(GAMMA)).toHaveLength(1);
  });

  it("resumes a paused task before its time without moving it", async () => {
    await schedule();
    await setScheduledTaskPause(pauseContext(), TASK_ID, true);

    expect(await setScheduledTaskPause(pauseContext(), TASK_ID, false)).toEqual({ ok: true, value: undefined });

    expect(await upcoming()).toMatchObject([{ id: TASK_ID, paused: false, runAt: RUN_AT }]);
  });

  it("refuses to pause a run that already fired", async () => {
    await schedule();
    context.clock.set(RUN_AT);
    await runDueScheduledTasks(deps);

    expect(await setScheduledTaskPause(pauseContext(), TASK_ID, true)).toEqual({ ok: false, error: "scheduled.not_scheduled" });
  });

  it("turns a one-off task into a daily one by editing it", async () => {
    const saved = await createScheduledTask(
      { db: context.db, clock: context.clock, timeZone: ZONE },
      { id: TASK_ID, title: "Once", prompt: "Review the code.", runAt: RUN_AT_LOCAL, repositoryKeys: PROJECTS, createdBy: "user-1", createdByName: "" },
    );
    expect(saved.ok && saved.value.repeat).toBe("none");

    const edited = await editScheduledTask({ db: context.db, clock: context.clock, timeZone: ZONE }, TASK_ID, {
      title: "Daily",
      prompt: "Review the code.",
      runAt: RUN_AT_LOCAL,
      repositoryKeys: PROJECTS,
      repeat: "daily",
    });
    expect(edited.ok).toBe(true);
    context.clock.set(RUN_AT);
    await runDueScheduledTasks(deps);

    expect((await upcoming()).map((task) => [task.title, task.runAt])).toEqual([["Daily", new Date(RUN_AT.getTime() + 24 * 60 * MINUTE)]]);
  });
});
