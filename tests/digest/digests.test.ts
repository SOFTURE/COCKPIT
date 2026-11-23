import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findLatestDigest, findPendingDigest, insertDigest, markDigestSent } from "../../modules/digest/digests.ts";
import { createTestContext, getModuleHealth, TEST_START, type TestContext } from "../support/test-context.ts";

const MAIL = { subject: "COCKPIT: 1 change since the last digest", text: "Shipped", html: "<h2>Shipped</h2>" };

describe("the digest log", () => {
  let context: TestContext;

  beforeEach(async () => {
    context = await createTestContext();
  });

  afterEach(async () => {
    await context.database.close();
  });

  it("is empty before the first digest", async () => {
    expect(await findLatestDigest(context.db)).toEqual({ ok: true, value: null });
    expect(await findPendingDigest(context.db)).toEqual({ ok: true, value: null });
  });

  it("returns the newest row and the pending one with its mail", async () => {
    await insertDigest(context.db, { status: "baseline", snapshot: { projects: {} }, createdAt: TEST_START });
    const pending = await insertDigest(context.db, { status: "pending", snapshot: { projects: { a: 1 } }, mail: MAIL, createdAt: TEST_START });
    expect(pending).toMatchObject({ ok: true, value: { status: "pending", mail: MAIL, sentAt: null } });
    const latest = await findLatestDigest(context.db);
    expect(latest).toMatchObject({ ok: true, value: { status: "pending", snapshot: { projects: { a: 1 } } } });
    expect(await findPendingDigest(context.db)).toEqual(latest);
  });

  it("keeps at most one pending digest", async () => {
    await insertDigest(context.db, { status: "pending", snapshot: {}, mail: MAIL, createdAt: TEST_START });
    expect(await insertDigest(context.db, { status: "pending", snapshot: {}, mail: MAIL, createdAt: TEST_START })).toEqual({ ok: false, error: "digest.pending_exists" });
  });

  it("marks a pending digest sent once", async () => {
    const pending = await insertDigest(context.db, { status: "pending", snapshot: {}, mail: MAIL, createdAt: TEST_START });
    const id = pending.ok ? pending.value.id : 0;
    const sentAt = new Date(TEST_START.getTime() + 1000);
    expect(await markDigestSent(context.db, id, sentAt)).toEqual({ ok: true, value: true });
    expect(await markDigestSent(context.db, id, sentAt)).toEqual({ ok: true, value: false });
    expect(await findPendingDigest(context.db)).toEqual({ ok: true, value: null });
    expect(await findLatestDigest(context.db)).toMatchObject({ ok: true, value: { status: "sent", sentAt } });
  });

  it("answers the digest health check on a migrated database", async () => {
    expect(await getModuleHealth("digest")(context)).toEqual({ ok: true, value: undefined });
  });
});
