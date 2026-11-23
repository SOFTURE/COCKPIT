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
      readAt: TEST_START,
    });
    expect(recorded.ok).toBe(true);
    expect(await deleteRepository(context.db, "example-org/alpha-app")).toEqual({ ok: true, value: true });
    expect(await findForgeFacts(context.db)).toEqual({ ok: true, value: [] });
  });

  it("are refused for a repository nobody watches", async () => {
    const recorded = await recordForgeFacts(context.db, {
      key: "example-org/unknown-app",
      release: { status: "unavailable" },
      runs: { status: "unavailable" },
      readAt: TEST_START,
    });
    expect(recorded.ok).toBe(false);
  });
});
