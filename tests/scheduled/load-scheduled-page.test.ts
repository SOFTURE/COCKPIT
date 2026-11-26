import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { claimSend, markSendFailed, markSendSent, saveBroadcast } from "../../modules/projects/broadcasts.ts";
import { claimScheduledTaskNow, insertScheduledTask, markScheduledTaskSent } from "../../modules/projects/scheduled-tasks.ts";
import { loadScheduledPage } from "../../src/scheduled/load-scheduled-page.ts";
import { createTestContext, TEST_START, type TestContext } from "../support/test-context.ts";

const HOUR = 60 * 60_000;
const IDS = [
  "00000000-0000-4000-8000-000000000001",
  "00000000-0000-4000-8000-000000000002",
  "00000000-0000-4000-8000-000000000003",
  "00000000-0000-4000-8000-000000000004",
] as const;
const KEYS = ["example-org/alpha-app", "example-org/beta-app"] as const;

describe("loadScheduledPage", () => {
  let context: TestContext;

  async function add(id: string, hoursFromStart: number) {
    await insertScheduledTask(context.db, {
      id,
      title: `Task ${id.slice(-1)}`,
      prompt: "Run the doctor.",
      repositoryKeys: [...KEYS],
      runAt: new Date(TEST_START.getTime() + hoursFromStart * HOUR),
      createdBy: "user-1",
      createdByName: null,
      at: TEST_START,
    });
  }

  /** Fires a task at `hoursFromStart` with one send per project; the second send fails when `failSecond`. */
  async function fire(id: string, hoursFromStart: number, failSecond: boolean) {
    const at = new Date(TEST_START.getTime() + hoursFromStart * HOUR);
    const claimed = await claimScheduledTaskNow(context.db, id, at);
    const broadcastId = claimed.ok ? claimed.value?.broadcastId : null;
    if (broadcastId === null || broadcastId === undefined) {
      throw new Error("the task was not claimed");
    }
    await saveBroadcast(context.db, { id: broadcastId, title: "t", body: "b", sentBy: "user-1", sentByName: null, createdAt: at });
    for (const [index, key] of KEYS.entries()) {
      const claim = await claimSend(context.db, { broadcastId, repositoryKey: key, fullName: key, at });
      if (!claim.ok || claim.value.kind !== "claimed") {
        throw new Error("the send was not claimed");
      }
      if (failSecond && index === 1) {
        await markSendFailed(context.db, claim.value.id, { failure: "forge_refused", token: null, at });
      } else {
        await markSendSent(context.db, claim.value.id, { number: index + 1, url: `https://forge.example.test/${key}/issues/1` }, at);
      }
    }
    await markScheduledTaskSent(context.db, { id, claimedAt: at, skippedKeys: [], at });
    return broadcastId;
  }

  beforeEach(async () => {
    context = await createTestContext();
  });

  afterEach(async () => {
    await context.database.close();
  });

  it("has two empty tabs with no tasks", async () => {
    expect(await loadScheduledPage(context.db)).toEqual({ ok: true, value: { scheduled: [], done: [] } });
  });

  it("lists the scheduled tab soonest first and the done tab newest first, each run with its result", async () => {
    const [first, second, third, fourth] = IDS;
    await add(third, 30);
    await add(first, 10);
    await add(second, 20);
    await add(fourth, 40);
    const older = await fire(second, 1, false);
    const newer = await fire(fourth, 2, true);

    const page = await loadScheduledPage(context.db);

    expect(page.ok && page.value.scheduled.map((row) => row.id)).toEqual([first, third]);
    expect(page.ok && page.value.done.map((row) => [row.id, row.result, row.href])).toEqual([
      [fourth, { kind: "failed", failed: 1, total: 2 }, `/broadcast/${newer}`],
      [second, { kind: "sent", sent: 2, total: 2 }, `/broadcast/${older}`],
    ]);
  });
});
