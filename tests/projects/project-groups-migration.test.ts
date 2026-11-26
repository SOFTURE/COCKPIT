import { readFile } from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findProjectGroups } from "../../modules/projects/groups.ts";
import { findRepositories } from "../../modules/projects/queries.ts";
import { createTestContext, type TestContext } from "../support/test-context.ts";

const MIGRATION = new URL("../../modules/projects/migrations/0009_create_project_groups.sql", import.meta.url);

/** The rollback the migration's header gives, run as written there (statements only). */
async function readRollback(): Promise<string> {
  const text = await readFile(MIGRATION, "utf8");
  return text
    .split("\n")
    .filter((line) => line.startsWith("--   ALTER") || line.startsWith("--   DROP"))
    .map((line) => line.slice("--   ".length))
    .join("\n");
}

describe("migration projects/0009: project groups", () => {
  let context: TestContext;

  beforeEach(async () => {
    context = await createTestContext();
  });

  afterEach(async () => {
    await context.database.close();
  });

  it("rolls back to the 0008 shape, then seeds one group per owner, named as the forge writes it, with every repository in it", async () => {
    const client = context.database.client;
    await client.exec(await readRollback());
    for (const fullName of ["Atlas-Works/alpha-app", "atlas-works/beta-app", "Birch-Labs/gamma-app"]) {
      await client.query(
        `INSERT INTO projects.repositories (repository_key, full_name, default_branch, has_state, checked_at) VALUES ($1, $2, 'main', true, now())`,
        [fullName.toLowerCase(), fullName],
      );
    }

    await client.exec(`BEGIN; SET LOCAL search_path TO projects, public; ${await readFile(MIGRATION, "utf8")} COMMIT;`);

    const groups = await findProjectGroups(context.db);
    const byName = groups.ok ? groups.value.map(({ name, defaultOwner, projectCount }) => ({ name, defaultOwner, projectCount })) : [];
    expect(byName.sort((left, right) => left.name.localeCompare(right.name))).toEqual([
      { name: "Atlas-Works", defaultOwner: "atlas-works", projectCount: 2 },
      { name: "Birch-Labs", defaultOwner: "birch-labs", projectCount: 1 },
    ]);
    const repositories = await findRepositories(context.db);
    expect(repositories.ok && repositories.value.every((repository) => repository.groupId !== null)).toBe(true);
  });

  it("seeds nothing on an empty database", async () => {
    expect(await findProjectGroups(context.db)).toEqual({ ok: true, value: [] });
  });
});
