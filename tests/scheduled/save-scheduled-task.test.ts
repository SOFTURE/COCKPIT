import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { claimScheduledTaskNow, findScheduledTask, markScheduledTaskSent } from "../../modules/projects/scheduled-tasks.ts";
import { saveBroadcast, findBroadcast } from "../../modules/projects/broadcasts.ts";
import { insertRepository } from "../../modules/projects/queries.ts";
import { removeScheduledTask } from "../../src/scheduled/delete-scheduled-task.ts";
import {
  createScheduledTask,
  editScheduledTask,
  getRunInstant,
  type NewScheduledTaskInput,
  type ScheduledTaskContext,
} from "../../src/scheduled/save-scheduled-task.ts";
import { createTestContext, TEST_START, type TestContext } from "../support/test-context.ts";

const ZONE = "Europe/Warsaw";
const TASK_ID = "6c3f1d2a-8b4e-4c1a-9e7f-0a1b2c3d4e5f";
const ALPHA = "example-org/alpha-app";
const BETA = "example-org/beta-app";
// TEST_START is 2026-11-02T09:00:00Z, 10:00 in Warsaw (CET).

describe("the run time of a scheduled task", () => {
  it("reads the local time in the app's zone", () => {
    expect(getRunInstant("2026-11-09T08:00", ZONE, TEST_START)).toEqual({ ok: true, value: new Date("2026-11-09T07:00:00Z") });
  });

  it("refuses a malformed time", () => {
    expect(getRunInstant("2026-11-09 08:00", ZONE, TEST_START)).toEqual({ ok: false, error: "scheduled.time_invalid" });
    expect(getRunInstant("", ZONE, TEST_START)).toEqual({ ok: false, error: "scheduled.time_invalid" });
    expect(getRunInstant("2026-02-30T08:00", ZONE, TEST_START)).toEqual({ ok: false, error: "scheduled.time_invalid" });
  });

  it("accepts the current minute within one minute of grace and refuses an earlier time", () => {
    const now = new Date("2026-11-02T09:00:59Z");
    expect(getRunInstant("2026-11-02T10:00", ZONE, now)).toEqual({ ok: true, value: new Date("2026-11-02T09:00:00Z") });
    expect(getRunInstant("2026-11-02T09:59", ZONE, now)).toEqual({ ok: false, error: "scheduled.time_past" });
    expect(getRunInstant("2026-11-02T09:59", ZONE, new Date("2026-11-02T09:00:00Z"))).toEqual({ ok: true, value: new Date("2026-11-02T08:59:00Z") });
  });

  it("moves a time the spring DST change skips as core defines: 02:30 becomes 03:30 CEST", () => {
    expect(getRunInstant("2026-03-29T02:30", ZONE, new Date("2026-03-01T00:00:00Z"))).toEqual({ ok: true, value: new Date("2026-03-29T01:30:00Z") });
  });

  it("takes the first occurrence of a time the autumn DST change repeats", () => {
    expect(getRunInstant("2026-10-25T02:30", ZONE, new Date("2026-10-01T00:00:00Z"))).toEqual({ ok: true, value: new Date("2026-10-25T00:30:00Z") });
  });
});

describe("saving a scheduled task", () => {
  let context: TestContext;
  let scheduled: ScheduledTaskContext;
  let input: NewScheduledTaskInput;

  beforeEach(async () => {
    context = await createTestContext();
    scheduled = { db: context.db, clock: context.clock, timeZone: ZONE };
    for (const key of [ALPHA, BETA]) {
      await insertRepository(context.db, { key, fullName: key, defaultBranch: "main", hasState: true, missingPermissions: [], checkedAt: TEST_START });
    }
    input = {
      id: TASK_ID,
      title: "  Check   code quality ",
      prompt: "  Run the quality review.\n",
      runAt: "2026-11-09T08:00",
      repositoryKeys: [ALPHA, BETA, ALPHA],
      createdBy: "user-1",
      createdByName: "Ada Example",
    };
  });

  afterEach(async () => {
    await context.database.close();
  });

  it("stores the normalised text, the instant of the local time and each project once", async () => {
    const saved = await createScheduledTask(scheduled, input);

    expect(saved.ok && saved.value).toMatchObject({
      id: TASK_ID,
      title: "Check code quality",
      prompt: "Run the quality review.",
      runAt: new Date("2026-11-09T07:00:00Z"),
      repositoryKeys: [ALPHA, BETA],
      status: "scheduled",
      createdByName: "Ada Example",
      createdAt: TEST_START,
    });
  });

  it.each([
    [{ title: "   " }, "scheduled.title_missing"],
    [{ title: "x".repeat(201) }, "scheduled.title_too_long"],
    [{ prompt: "\n " }, "scheduled.prompt_missing"],
    [{ prompt: "x".repeat(10_001) }, "scheduled.prompt_too_long"],
    [{ repositoryKeys: [] }, "scheduled.no_projects"],
    [{ repositoryKeys: [ALPHA, "example-org/unknown-app"] }, "scheduled.project_not_watched"],
    [{ runAt: "2026-11-02T09:58" }, "scheduled.time_past"],
    [{ runAt: "tomorrow" }, "scheduled.time_invalid"],
  ] as const)("refuses %j with %s and stores nothing", async (change, code) => {
    expect(await createScheduledTask(scheduled, { ...input, ...change })).toEqual({ ok: false, error: code });
    expect(await findScheduledTask(context.db, TASK_ID)).toEqual({ ok: true, value: null });
  });

  it("accepts a title and a prompt exactly at their limits", async () => {
    const saved = await createScheduledTask(scheduled, { ...input, title: "t".repeat(200), prompt: "p".repeat(10_000) });
    expect(saved.ok).toBe(true);
  });

  it("edits a scheduled task with the same rules", async () => {
    await createScheduledTask(scheduled, input);
    const fields = { title: "Renamed", prompt: "Another prompt", runAt: "2026-11-10T09:30", repositoryKeys: [BETA] };

    expect(await editScheduledTask(scheduled, TASK_ID, { ...fields, runAt: "2026-11-01T09:30" })).toEqual({ ok: false, error: "scheduled.time_past" });
    expect(await editScheduledTask(scheduled, TASK_ID, fields)).toEqual({ ok: true, value: undefined });
    const stored = await findScheduledTask(context.db, TASK_ID);
    expect(stored.ok && stored.value).toMatchObject({ title: "Renamed", prompt: "Another prompt", runAt: new Date("2026-11-10T08:30:00Z"), repositoryKeys: [BETA] });
  });

  it("refuses to edit an unknown task", async () => {
    const fields = { title: "Renamed", prompt: "Another prompt", runAt: "2026-11-10T09:30", repositoryKeys: [BETA] };
    expect(await editScheduledTask(scheduled, TASK_ID, fields)).toEqual({ ok: false, error: "scheduled.not_found" });
  });

  it("refuses to edit a sent task", async () => {
    await createScheduledTask(scheduled, input);
    await claimScheduledTaskNow(context.db, TASK_ID, TEST_START);
    await markScheduledTaskSent(context.db, { id: TASK_ID, claimedAt: TEST_START, skippedKeys: [], at: TEST_START });
    const fields = { title: "Renamed", prompt: "Another prompt", runAt: "2026-11-10T09:30", repositoryKeys: [BETA] };

    expect(await editScheduledTask(scheduled, TASK_ID, fields)).toEqual({ ok: false, error: "scheduled.not_editable" });
    const stored = await findScheduledTask(context.db, TASK_ID);
    expect(stored.ok && stored.value?.title).toBe("Check code quality");
  });

  it("deletes a sent task's entry and keeps its broadcast", async () => {
    await createScheduledTask(scheduled, input);
    const claimed = await claimScheduledTaskNow(context.db, TASK_ID, TEST_START);
    const broadcastId = claimed.ok && claimed.value !== null && claimed.value.broadcastId !== null ? claimed.value.broadcastId : "";
    await saveBroadcast(context.db, { id: broadcastId, title: "Check code quality", body: "Run the quality review.", sentBy: "user-1", sentByName: "Ada Example", createdAt: TEST_START });
    await markScheduledTaskSent(context.db, { id: TASK_ID, claimedAt: TEST_START, skippedKeys: [], at: TEST_START });

    expect(await removeScheduledTask(context.db, TASK_ID)).toEqual({ ok: true, value: true });
    expect(await findScheduledTask(context.db, TASK_ID)).toEqual({ ok: true, value: null });
    const broadcast = await findBroadcast(context.db, broadcastId);
    expect(broadcast.ok && broadcast.value?.id).toBe(broadcastId);
  });

  it("refuses to delete a task being sent, and treats an id already gone as no failure", async () => {
    await createScheduledTask(scheduled, input);
    await claimScheduledTaskNow(context.db, TASK_ID, TEST_START);

    expect(await removeScheduledTask(context.db, TASK_ID)).toEqual({ ok: false, error: "scheduled.not_deletable" });
    expect(await removeScheduledTask(context.db, "7d4e2e3b-9c5f-4d2b-8f80-1b2c3d4e5f60")).toEqual({ ok: true, value: false });
  });
});
