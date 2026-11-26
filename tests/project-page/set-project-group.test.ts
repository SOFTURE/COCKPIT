import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { insertProjectGroup } from "../../modules/projects/groups.ts";
import { findRepositories, insertRepository } from "../../modules/projects/queries.ts";
import { setProjectGroup, type SetProjectGroupDependencies } from "../../src/project-page/set-project-group.ts";
import { createTestContext, TEST_START, type TestContext } from "../support/test-context.ts";

const KEY = "example-org/grouping-app";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    data.set(name, value);
  }
  return data;
}

async function readGroupId(context: TestContext): Promise<number | null | undefined> {
  const listed = await findRepositories(context.db);
  return listed.ok ? listed.value.find((row) => row.key === KEY)?.groupId : undefined;
}

describe("setProjectGroup", () => {
  let context: TestContext;
  let dependencies: SetProjectGroupDependencies;
  let groupId: number;

  beforeEach(async () => {
    context = await createTestContext();
    dependencies = { requireUser: () => Promise.resolve({ id: "user-1" }), getDb: () => Promise.resolve(context.db) };
    const added = await insertRepository(context.db, {
      key: KEY,
      fullName: "example-org/grouping-app",
      defaultBranch: "main",
      hasState: true,
      missingPermissions: [],
      checkedAt: TEST_START,
    });
    const group = await insertProjectGroup(context.db, { name: "Client work", defaultOwner: null });
    if (!added.ok || !group.ok) {
      throw new Error("setProjectGroup test: seeding failed");
    }
    groupId = group.value.id;
  });

  afterEach(async () => {
    await context.database.close();
  });

  it("checks the signed-in user first and writes nothing without one", async () => {
    let wasDatabaseReached = false;
    const signedOut: SetProjectGroupDependencies = {
      requireUser: () => Promise.reject(new Error("NEXT_REDIRECT /sign-in")),
      getDb: () => {
        wasDatabaseReached = true;
        return Promise.resolve(context.db);
      },
    };
    await expect(setProjectGroup(signedOut, form({ repositoryKey: KEY, groupId: String(groupId) }))).rejects.toThrow("NEXT_REDIRECT /sign-in");
    expect(wasDatabaseReached).toBe(false);
    expect(await readGroupId(context)).toBeNull();
  });

  it("puts the project into the picked group", async () => {
    const result = await setProjectGroup(dependencies, form({ repositoryKey: "Example-Org/Grouping-App", groupId: String(groupId) }));
    expect(result).toEqual({ ok: true, userId: "user-1", repositoryKey: KEY, groupId });
    expect(await readGroupId(context)).toBe(groupId);
  });

  it("puts the project into No group when the group id is empty", async () => {
    await setProjectGroup(dependencies, form({ repositoryKey: KEY, groupId: String(groupId) }));
    const result = await setProjectGroup(dependencies, form({ repositoryKey: KEY, groupId: "" }));
    expect(result).toEqual({ ok: true, userId: "user-1", repositoryKey: KEY, groupId: null });
    expect(await readGroupId(context)).toBeNull();
  });

  it("refuses a group that no longer exists as a value and keeps the stored group", async () => {
    await setProjectGroup(dependencies, form({ repositoryKey: KEY, groupId: String(groupId) }));
    const result = await setProjectGroup(dependencies, form({ repositoryKey: KEY, groupId: String(groupId + 1000) }));
    expect(result).toEqual({ ok: false, userId: "user-1", error: "not_found" });
    expect(await readGroupId(context)).toBe(groupId);
  });

  it("refuses a malformed group id or a missing project without writing", async () => {
    for (const fields of [{ repositoryKey: KEY, groupId: "abc" }, { repositoryKey: KEY, groupId: "-3" }, { repositoryKey: "", groupId: String(groupId) }]) {
      expect(await setProjectGroup(dependencies, form(fields))).toEqual({ ok: false, userId: "user-1", error: "invalid" });
    }
    expect(await setProjectGroup(dependencies, form({ repositoryKey: "example-org/unknown-app", groupId: String(groupId) }))).toEqual({
      ok: false,
      userId: "user-1",
      error: "not_found",
    });
    expect(await readGroupId(context)).toBeNull();
  });
});
