import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  deleteProjectGroup,
  findProjectGroups,
  insertProjectGroup,
  renameProjectGroup,
  setRepositoryGroup,
} from "../../modules/projects/groups.ts";
import { findRepositories, insertRepository } from "../../modules/projects/queries.ts";
import { createTestContext, TEST_START, type TestContext } from "../support/test-context.ts";

async function watch(context: TestContext, fullName: string) {
  const added = await insertRepository(context.db, {
    key: fullName.toLowerCase(),
    fullName,
    defaultBranch: "main",
    hasState: true,
    missingPermissions: [],
    checkedAt: TEST_START,
  });
  if (!added.ok) {
    throw new Error(`watch: adding ${fullName} failed (${added.error})`);
  }
  return added.value;
}

async function listGroupIds(context: TestContext) {
  const listed = await findRepositories(context.db);
  return listed.ok ? Object.fromEntries(listed.value.map((row) => [row.key, row.groupId])) : {};
}

describe("project groups", () => {
  let context: TestContext;

  beforeEach(async () => {
    context = await createTestContext();
  });

  afterEach(async () => {
    await context.database.close();
  });

  it("starts with no group", async () => {
    expect(await findProjectGroups(context.db)).toEqual({ ok: true, value: [] });
  });

  it("adds a group and lists it with its project count", async () => {
    const added = await insertProjectGroup(context.db, { name: "Client work", defaultOwner: "atlas-works" });
    expect(added).toMatchObject({ ok: true, value: { name: "Client work", defaultOwner: "atlas-works" } });
    await insertProjectGroup(context.db, { name: "Side projects", defaultOwner: null });
    await watch(context, "atlas-works/alpha-app");
    await watch(context, "atlas-works/beta-app");
    await watch(context, "birch-labs/gamma-app");

    const listed = await findProjectGroups(context.db);
    const counts = listed.ok ? Object.fromEntries(listed.value.map((group) => [group.name, group.projectCount])) : {};
    expect(counts).toEqual({ "Client work": 2, "Side projects": 0 });
  });

  it("refuses a duplicate name, whatever its case, and a duplicate owner, as values", async () => {
    await insertProjectGroup(context.db, { name: "Client work", defaultOwner: "atlas-works" });
    expect(await insertProjectGroup(context.db, { name: "CLIENT WORK", defaultOwner: null })).toEqual({ ok: false, error: "projects.group_name_taken" });
    expect(await insertProjectGroup(context.db, { name: "Other", defaultOwner: "atlas-works" })).toEqual({ ok: false, error: "projects.group_owner_taken" });
  });

  it("renames a group and changes its owner; a duplicate or an unknown id is a value", async () => {
    const first = await insertProjectGroup(context.db, { name: "Client work", defaultOwner: "atlas-works" });
    const second = await insertProjectGroup(context.db, { name: "Side projects", defaultOwner: null });
    if (!first.ok || !second.ok) {
      throw new Error("setup failed");
    }
    expect(await renameProjectGroup(context.db, first.value.id, { name: "Atlas", defaultOwner: null })).toEqual({
      ok: true,
      value: { id: first.value.id, name: "Atlas", defaultOwner: null },
    });
    expect(await renameProjectGroup(context.db, second.value.id, { name: "atlas", defaultOwner: null })).toEqual({ ok: false, error: "projects.group_name_taken" });
    expect(await renameProjectGroup(context.db, 999_999, { name: "Nobody", defaultOwner: null })).toEqual({ ok: false, error: "projects.group_not_found" });
  });

  it("deletes a group and its projects fall to no group", async () => {
    const group = await insertProjectGroup(context.db, { name: "Client work", defaultOwner: "atlas-works" });
    if (!group.ok) {
      throw new Error("setup failed");
    }
    await watch(context, "atlas-works/alpha-app");
    expect(await listGroupIds(context)).toEqual({ "atlas-works/alpha-app": group.value.id });

    expect(await deleteProjectGroup(context.db, group.value.id)).toEqual({ ok: true, value: group.value });
    expect(await listGroupIds(context)).toEqual({ "atlas-works/alpha-app": null });
    expect(await deleteProjectGroup(context.db, group.value.id)).toEqual({ ok: false, error: "projects.group_not_found" });
  });

  it("sets a repository's group and back to no group; an unknown group or repository is a value", async () => {
    const group = await insertProjectGroup(context.db, { name: "Side projects", defaultOwner: null });
    if (!group.ok) {
      throw new Error("setup failed");
    }
    await watch(context, "birch-labs/gamma-app");
    expect(await listGroupIds(context)).toEqual({ "birch-labs/gamma-app": null });

    expect(await setRepositoryGroup(context.db, "birch-labs/gamma-app", group.value.id)).toEqual({ ok: true, value: undefined });
    expect(await listGroupIds(context)).toEqual({ "birch-labs/gamma-app": group.value.id });
    expect(await setRepositoryGroup(context.db, "birch-labs/gamma-app", null)).toEqual({ ok: true, value: undefined });
    expect(await listGroupIds(context)).toEqual({ "birch-labs/gamma-app": null });
    expect(await setRepositoryGroup(context.db, "birch-labs/gamma-app", 999_999)).toEqual({ ok: false, error: "projects.group_not_found" });
    expect(await setRepositoryGroup(context.db, "birch-labs/missing-app", group.value.id)).toEqual({ ok: false, error: "projects.repository_not_found" });
  });

  it("refuses a name outside 1..60 characters or with outer spaces, and an owner outside the forge's form, in the database", async () => {
    expect(await insertProjectGroup(context.db, { name: " padded ", defaultOwner: null })).toMatchObject({ ok: false });
    expect(await insertProjectGroup(context.db, { name: "x".repeat(61), defaultOwner: null })).toMatchObject({ ok: false });
    expect(await insertProjectGroup(context.db, { name: "Upper owner", defaultOwner: "Atlas-Works" })).toMatchObject({ ok: false });
  });
});
