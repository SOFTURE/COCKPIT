import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findAdapterReads, recordAdapterRead } from "../../modules/adapters/reads.ts";
import { deleteRepository, insertRepository } from "../../modules/projects/queries.ts";
import { createTestContext, TEST_START, type TestContext } from "../support/test-context.ts";

const KEY = "example-org/alpha-app";

describe("adapter reads", () => {
  let context: TestContext;

  beforeEach(async () => {
    context = await createTestContext();
    await insertRepository(context.db, { key: KEY, fullName: KEY, defaultBranch: "main", hasState: true, missingPermissions: [], checkedAt: TEST_START });
  });

  afterEach(async () => {
    await context.database.close();
  });

  it("store one row per project and adapter; an unknown read replaces the last value", async () => {
    const later = new Date(TEST_START.getTime() + 60_000);
    await recordAdapterRead(context.db, { key: KEY, adapter: "observability", result: { status: "value", value: { kind: "healthy", rules: 2 } }, readAt: TEST_START });
    await recordAdapterRead(context.db, { key: KEY, adapter: "deploy", result: { status: "absent" }, readAt: TEST_START });
    expect(await recordAdapterRead(context.db, { key: KEY, adapter: "observability", result: { status: "unknown", reason: "backend_unavailable" }, readAt: later })).toEqual({
      ok: true,
      value: undefined,
    });

    const reads = await findAdapterReads(context.db);
    const byAdapter = Object.fromEntries((reads.ok ? reads.value : []).map((read) => [read.adapter, read]));
    expect(byAdapter).toEqual({
      observability: { key: KEY, adapter: "observability", status: "unknown", reason: "backend_unavailable", readAt: later },
      deploy: { key: KEY, adapter: "deploy", status: "absent", readAt: TEST_START },
    });
  });

  it("leave with their repository", async () => {
    await recordAdapterRead(context.db, { key: KEY, adapter: "observability", result: { status: "value", value: { kind: "healthy", rules: 1 } }, readAt: TEST_START });
    expect(await deleteRepository(context.db, KEY)).toEqual({ ok: true, value: true });
    expect(await findAdapterReads(context.db)).toEqual({ ok: true, value: [] });
  });

  it("refuse a read of a project nobody watches", async () => {
    const recorded = await recordAdapterRead(context.db, { key: "example-org/unknown-app", adapter: "observability", result: { status: "absent" }, readAt: TEST_START });
    expect(recorded.ok).toBe(false);
  });
});
