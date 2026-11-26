import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { claimScheduledTaskNow, insertScheduledTask, markScheduledTaskFailed, markScheduledTaskSent } from "../../modules/projects/scheduled-tasks.ts";
import { loadScheduledTasks } from "../../src/scheduled/load-scheduled-tasks.ts";
import { createTestContext, TEST_START, type TestContext } from "../support/test-context.ts";

const HOUR = 60 * 60_000;
const IDS = [
  "00000000-0000-4000-8000-000000000001",
  "00000000-0000-4000-8000-000000000002",
  "00000000-0000-4000-8000-000000000003",
  "00000000-0000-4000-8000-000000000004",
] as const;

describe("loadScheduledTasks", () => {
  let context: TestContext;

  async function add(id: string, hoursFromStart: number) {
    await insertScheduledTask(context.db, {
      id,
      title: `Task ${id.slice(-1)}`,
      prompt: "Run the doctor.",
      repositoryKeys: ["example-org/alpha-app"],
      runAt: new Date(TEST_START.getTime() + hoursFromStart * HOUR),
      createdBy: "user-1",
      createdByName: null,
      at: TEST_START,
    });
  }

  beforeEach(async () => {
    context = await createTestContext();
  });

  afterEach(async () => {
    await context.database.close();
  });

  it("is empty with no tasks", async () => {
    expect(await loadScheduledTasks(context.db)).toEqual({ ok: true, value: { upcoming: [], done: [] } });
  });

  it("lists upcoming tasks by planned time and fired ones newest first", async () => {
    const [first, second, third, fourth] = IDS;
    await add(third, 3);
    await add(first, 1);
    await add(second, 2);
    await add(fourth, 4);
    const early = new Date(TEST_START.getTime() + HOUR);
    const later = new Date(TEST_START.getTime() + 2 * HOUR);
    await claimScheduledTaskNow(context.db, second, early);
    await markScheduledTaskSent(context.db, { id: second, claimedAt: early, skippedKeys: [], at: early });
    await claimScheduledTaskNow(context.db, fourth, later);
    await markScheduledTaskFailed(context.db, { id: fourth, claimedAt: later, skippedKeys: [], at: later, failure: "no_projects" });

    const lists = await loadScheduledTasks(context.db);

    expect(lists.ok && lists.value.upcoming.map((task) => task.id)).toEqual([first, third]);
    expect(lists.ok && lists.value.done.map((task) => [task.id, task.status])).toEqual([
      [fourth, "failed"],
      [second, "sent"],
    ]);
  });
});
