import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { deleteRepository, findRepositories, insertRepository, type NewWatchedRepository } from "../../modules/projects/queries.ts";
import { createTestContext, getModuleHealth, TEST_START, type TestContext } from "../support/test-context.ts";

function newRepository(fullName: string, overrides: Partial<NewWatchedRepository> = {}): NewWatchedRepository {
  return {
    key: fullName.toLowerCase(),
    fullName,
    defaultBranch: "main",
    hasState: true,
    missingPermissions: [],
    checkedAt: TEST_START,
    ...overrides,
  };
}

describe("watched repositories", () => {
  let context: TestContext;

  beforeEach(async () => {
    context = await createTestContext();
  });

  afterEach(async () => {
    await context.database.close();
  });

  it("starts empty", async () => {
    expect(await findRepositories(context.db)).toEqual({ ok: true, value: [] });
  });

  it("adds a repository and lists the watched ones by name", async () => {
    await insertRepository(context.db, newRepository("example-org/beta", { hasState: false, missingPermissions: ["actions"] }));
    const added = await insertRepository(context.db, newRepository("Example-Org/Alpha"));
    expect(added).toMatchObject({ ok: true, value: { key: "example-org/alpha", fullName: "Example-Org/Alpha" } });

    const listed = await findRepositories(context.db);
    expect(listed.ok && listed.value.map((row) => [row.key, row.hasState, row.missingPermissions])).toEqual([
      ["example-org/alpha", true, []],
      ["example-org/beta", false, ["actions"]],
    ]);
  });

  it("refuses a repository that is already watched, whatever its letter case", async () => {
    await insertRepository(context.db, newRepository("example-org/alpha"));
    expect(await insertRepository(context.db, newRepository("EXAMPLE-ORG/alpha"))).toEqual({
      ok: false,
      error: "projects.already_watched",
    });
  });

  it("removes a repository and answers whether it was watched", async () => {
    await insertRepository(context.db, newRepository("example-org/alpha"));
    expect(await deleteRepository(context.db, "example-org/alpha")).toEqual({ ok: true, value: true });
    expect(await deleteRepository(context.db, "example-org/alpha")).toEqual({ ok: true, value: false });
    expect(await findRepositories(context.db)).toEqual({ ok: true, value: [] });
  });

  it("answers the health check once migrated", async () => {
    expect(await getModuleHealth("projects")(context)).toEqual({ ok: true, value: undefined });
  });
});
