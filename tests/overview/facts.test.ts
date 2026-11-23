import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findForgeFacts, recordForgeFacts } from "../../modules/overview/facts.ts";
import { deleteRepository, insertRepository } from "../../modules/projects/queries.ts";
import { createTestContext, TEST_START, type TestContext } from "../support/test-context.ts";

describe("forge facts", () => {
  let context: TestContext;

  beforeEach(async () => {
    context = await createTestContext();
    await insertRepository(context.db, {
      key: "example-org/alpha-app",
      fullName: "example-org/alpha-app",
      defaultBranch: "main",
      hasState: true,
      missingPermissions: [],
      checkedAt: TEST_START,
    });
  });

  afterEach(async () => {
    await context.database.close();
  });

  it("leave with their repository", async () => {
    const recorded = await recordForgeFacts(context.db, {
      key: "example-org/alpha-app",
      release: { status: "ok", value: null },
      runs: { status: "ok", value: { ci: null, qualityReview: null } },
      doctor: { status: "ok", value: { kind: "missing" } },
      readAt: TEST_START,
    });
    expect(recorded.ok).toBe(true);
    expect(await deleteRepository(context.db, "example-org/alpha-app")).toEqual({ ok: true, value: true });
    expect(await findForgeFacts(context.db)).toEqual({ ok: true, value: [] });
  });

  it("keep the last good doctor result when a later read fails, and say why it is old", async () => {
    const failing = { kind: "failing", url: "https://forge.example.test/doctor/1", codes: [{ code: "roadmap.stale", count: 2 }] };
    await recordForgeFacts(context.db, {
      key: "example-org/alpha-app",
      release: { status: "ok", value: null },
      runs: { status: "ok", value: { ci: null, qualityReview: null } },
      doctor: { status: "ok", value: failing },
      readAt: TEST_START,
    });
    const later = new Date(TEST_START.getTime() + 60_000);
    await recordForgeFacts(context.db, {
      key: "example-org/alpha-app",
      release: { status: "ok", value: null },
      runs: { status: "ok", value: { ci: null, qualityReview: null } },
      doctor: { status: "not_readable" },
      readAt: later,
    });
    const stored = await findForgeFacts(context.db);
    expect(stored.ok ? stored.value : []).toEqual([expect.objectContaining({ doctor: failing, doctorStatus: "not_readable", readAt: later })]);
  });

  it("are refused for a repository nobody watches", async () => {
    const recorded = await recordForgeFacts(context.db, {
      key: "example-org/unknown-app",
      release: { status: "unavailable" },
      runs: { status: "unavailable" },
      doctor: { status: "unavailable" },
      readAt: TEST_START,
    });
    expect(recorded.ok).toBe(false);
  });
});
