import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { claimSend, deleteBroadcast, findBroadcast, findBroadcasts, findSends, saveBroadcast } from "../../modules/projects/broadcasts.ts";
import { createTestContext, TEST_START, type TestContext } from "../support/test-context.ts";

const KEPT_ID = "0b6f7f0e-3c55-4b8e-9d0a-5f1c2e7a9b10";
const DELETED_ID = "7c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f";
const UNKNOWN_ID = "11111111-2222-4333-8444-555555555555";

describe("deleteBroadcast", () => {
  let context: TestContext;

  async function storeBroadcastWithSends(id: string, title: string) {
    const saved = await saveBroadcast(context.db, { id, title, body: "Body", sentBy: "user-1", sentByName: null, createdAt: TEST_START });
    expect(saved.ok).toBe(true);
    for (const fullName of ["example-org/alpha-app", "example-org/beta-app"]) {
      const claim = await claimSend(context.db, { broadcastId: id, repositoryKey: fullName, fullName, at: TEST_START });
      expect(claim.ok).toBe(true);
    }
  }

  beforeEach(async () => {
    context = await createTestContext();
    await storeBroadcastWithSends(KEPT_ID, "Kept");
    await storeBroadcastWithSends(DELETED_ID, "Deleted");
  });

  afterEach(async () => {
    await context.database.close();
  });

  it("removes the broadcast and every one of its sends, and leaves another broadcast and its sends alone", async () => {
    expect(await deleteBroadcast(context.db, DELETED_ID)).toEqual({ ok: true, value: true });

    expect(await findBroadcast(context.db, DELETED_ID)).toEqual({ ok: true, value: null });
    expect(await findSends(context.db, DELETED_ID)).toEqual({ ok: true, value: [] });
    const remaining = await findBroadcasts(context.db);
    expect(remaining.ok ? remaining.value.map((broadcast) => broadcast.id) : null).toEqual([KEPT_ID]);
    const keptSends = await findSends(context.db, KEPT_ID);
    expect(keptSends.ok ? keptSends.value.map((send) => send.repositoryKey) : null).toEqual(["example-org/alpha-app", "example-org/beta-app"]);
  });

  it("reports false for an id that names no broadcast and deletes nothing", async () => {
    expect(await deleteBroadcast(context.db, UNKNOWN_ID)).toEqual({ ok: true, value: false });

    const remaining = await findBroadcasts(context.db);
    expect(remaining.ok ? remaining.value.length : null).toBe(2);
  });

  it("reports false when the same broadcast is deleted a second time", async () => {
    expect(await deleteBroadcast(context.db, DELETED_ID)).toEqual({ ok: true, value: true });
    expect(await deleteBroadcast(context.db, DELETED_ID)).toEqual({ ok: true, value: false });
  });
});
