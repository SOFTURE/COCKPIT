import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  claimDueScheduledTasks,
  claimScheduledTaskNow,
  deleteScheduledTask,
  findScheduledTask,
  insertScheduledTask,
  markScheduledTaskSent,
  updateScheduledTask,
  type NewScheduledTask,
} from "../../modules/projects/scheduled-tasks.ts";
import { createTestContext, TEST_START, type TestContext } from "../support/test-context.ts";

const TASK_ID = "6c3f1d2a-8b4e-4c1a-9e7f-0a1b2c3d4e5f";
const OTHER_ID = "7d4e2e3b-9c5f-4d2b-8f80-1b2c3d4e5f60";
const MINUTE = 60_000;

function newTask(id: string, runAt: Date): NewScheduledTask {
  return {
    id,
    title: "Check code quality",
    prompt: "Run the quality review on the main branch.",
    repositoryKeys: ["example-org/alpha-app"],
    runAt,
    createdBy: "user-1",
    createdByName: "Ada Example",
    at: TEST_START,
  };
}

describe("scheduled tasks storage", () => {
  let context: TestContext;

  beforeEach(async () => {
    context = await createTestContext();
  });

  afterEach(async () => {
    await context.database.close();
  });

  it("stores a task as scheduled, and a second insert with the same id returns the first", async () => {
    const first = await insertScheduledTask(context.db, newTask(TASK_ID, new Date(TEST_START.getTime() + 60 * MINUTE)));
    const again = await insertScheduledTask(context.db, { ...newTask(TASK_ID, TEST_START), title: "Another title" });

    expect(first.ok && first.value).toMatchObject({ id: TASK_ID, status: "scheduled", broadcastId: null, skippedKeys: [], title: "Check code quality" });
    expect(again.ok && again.value).toMatchObject({ id: TASK_ID, title: "Check code quality" });
  });

  it("updates only a scheduled task", async () => {
    await insertScheduledTask(context.db, newTask(TASK_ID, TEST_START));
    const change = { title: "Renamed", prompt: "New prompt", repositoryKeys: ["example-org/beta-app"], runAt: TEST_START, repeat: "none" as const, at: TEST_START };

    expect(await updateScheduledTask(context.db, TASK_ID, change)).toEqual({ ok: true, value: true });
    await claimScheduledTaskNow(context.db, TASK_ID, TEST_START);
    expect(await updateScheduledTask(context.db, TASK_ID, { ...change, title: "Too late" })).toEqual({ ok: true, value: false });
    const stored = await findScheduledTask(context.db, TASK_ID);
    expect(stored.ok && stored.value).toMatchObject({ title: "Renamed", status: "sending", repositoryKeys: ["example-org/beta-app"] });
  });

  it("claims only due tasks, each once, with a broadcast id", async () => {
    await insertScheduledTask(context.db, newTask(TASK_ID, TEST_START));
    await insertScheduledTask(context.db, newTask(OTHER_ID, new Date(TEST_START.getTime() + MINUTE)));
    const claim = { at: TEST_START, staleBefore: new Date(TEST_START.getTime() - 11 * MINUTE), limit: 10, getNextRunAt: () => null };

    const first = await claimDueScheduledTasks(context.db, claim);
    const second = await claimDueScheduledTasks(context.db, claim);

    expect(first.ok && first.value.map((task) => [task.id, task.status])).toEqual([[TASK_ID, "sending"]]);
    expect(first.ok && first.value[0]?.broadcastId).toMatch(/^[0-9a-f-]{36}$/);
    expect(first.ok && first.value[0]?.claimedAt).toEqual(TEST_START);
    expect(second).toEqual({ ok: true, value: [] });
  });

  it("takes over a stale sending run and keeps its broadcast id", async () => {
    await insertScheduledTask(context.db, newTask(TASK_ID, TEST_START));
    const first = await claimDueScheduledTasks(context.db, { at: TEST_START, staleBefore: TEST_START, limit: 10, getNextRunAt: () => null });
    const later = new Date(TEST_START.getTime() + 20 * MINUTE);

    const notYetStale = await claimDueScheduledTasks(context.db, { at: later, staleBefore: new Date(TEST_START.getTime() - 1), limit: 10, getNextRunAt: () => null });
    const takeover = await claimDueScheduledTasks(context.db, { at: later, staleBefore: TEST_START, limit: 10, getNextRunAt: () => null });

    expect(notYetStale).toEqual({ ok: true, value: [] });
    expect(takeover.ok && takeover.value.map((task) => task.claimedAt)).toEqual([later]);
    expect(takeover.ok && takeover.value[0]?.broadcastId).toBe(first.ok ? first.value[0]?.broadcastId : "none");
  });

  it("records a run as sent only for the claim that holds it", async () => {
    await insertScheduledTask(context.db, newTask(TASK_ID, TEST_START));
    await claimScheduledTaskNow(context.db, TASK_ID, TEST_START);
    const later = new Date(TEST_START.getTime() + MINUTE);

    expect(await markScheduledTaskSent(context.db, { id: TASK_ID, claimedAt: later, skippedKeys: [], at: later })).toEqual({ ok: true, value: false });
    expect(await markScheduledTaskSent(context.db, { id: TASK_ID, claimedAt: TEST_START, skippedKeys: ["example-org/gone-app"], at: later })).toEqual({ ok: true, value: true });
    const stored = await findScheduledTask(context.db, TASK_ID);
    expect(stored.ok && stored.value).toMatchObject({ status: "sent", sentAt: later, runAt: TEST_START, skippedKeys: ["example-org/gone-app"] });
  });

  it("refuses to delete a run being sent and deletes a scheduled or sent one", async () => {
    await insertScheduledTask(context.db, newTask(TASK_ID, TEST_START));
    await insertScheduledTask(context.db, newTask(OTHER_ID, TEST_START));
    await claimScheduledTaskNow(context.db, TASK_ID, TEST_START);

    expect(await deleteScheduledTask(context.db, TASK_ID)).toEqual({ ok: true, value: false });
    expect(await deleteScheduledTask(context.db, OTHER_ID)).toEqual({ ok: true, value: true });
    await markScheduledTaskSent(context.db, { id: TASK_ID, claimedAt: TEST_START, skippedKeys: [], at: TEST_START });
    expect(await deleteScheduledTask(context.db, TASK_ID)).toEqual({ ok: true, value: true });
  });

  it("refuses an empty project list at the table", async () => {
    const stored = await insertScheduledTask(context.db, { ...newTask(TASK_ID, TEST_START), repositoryKeys: [] });
    expect(stored.ok).toBe(false);
  });
});
