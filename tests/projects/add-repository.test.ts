import { fakeFetch } from "@softure-ai/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { insertProjectGroup } from "../../modules/projects/groups.ts";
import { findRepositories } from "../../modules/projects/queries.ts";
import { createForgeClient } from "../../src/forge/client.ts";
import { addRepository, removeRepository } from "../../src/projects/add-repository.ts";
import { createTestContext, TEST_START, type TestContext } from "../support/test-context.ts";

const API = "https://forge.example.test";

function readableForge(fullName: string, options: { hasState?: boolean } = {}) {
  const base = `${API}/repos/${fullName}`;
  return fakeFetch([
    { method: "GET", url: base, json: { full_name: fullName, default_branch: "trunk" } },
    options.hasState === false
      ? { method: "GET", url: `${base}/contents/context/state.json?ref=trunk`, status: 404, json: { message: "Not Found" } }
      : { method: "GET", url: `${base}/contents/context/state.json?ref=trunk`, json: { type: "file" } },
    { method: "GET", url: `${base}/pulls?per_page=1`, json: [] },
    { method: "GET", url: `${base}/issues?per_page=1`, json: [] },
    { method: "GET", url: `${base}/actions/runs?per_page=1`, json: { workflow_runs: [] } },
  ]);
}

describe("addRepository", () => {
  let context: TestContext;

  beforeEach(async () => {
    context = await createTestContext();
  });

  afterEach(async () => {
    await context.database.close();
  });

  it("saves a readable repository with its main branch and the time of the check", async () => {
    const forge = readableForge("example-org/alpha-app", { hasState: false });
    const client = createForgeClient({ token: "test-token", baseUrl: API, fetch: forge.fetch });
    const result = await addRepository({ db: context.db, client, clock: context.clock, input: "example-org/alpha-app" });
    expect(result).toMatchObject({
      ok: true,
      value: { key: "example-org/alpha-app", defaultBranch: "trunk", hasState: false, missingPermissions: [], checkedAt: TEST_START },
    });
    forge.expectAllUsed();
  });

  it("puts the repository into the group whose new projects come from its owner, whatever the letter case", async () => {
    const group = await insertProjectGroup(context.db, { name: "Client work", defaultOwner: "example-org" });
    const forge = readableForge("Example-Org/alpha-app");
    const client = createForgeClient({ token: "test-token", baseUrl: API, fetch: forge.fetch });
    const result = await addRepository({ db: context.db, client, clock: context.clock, input: "Example-Org/alpha-app" });
    expect(result).toMatchObject({ ok: true, value: { key: "example-org/alpha-app", groupId: group.ok ? group.value.id : -1 } });
  });

  it("leaves the repository in no group when no group takes its owner", async () => {
    await insertProjectGroup(context.db, { name: "Client work", defaultOwner: "other-org" });
    const forge = readableForge("example-org/alpha-app");
    const client = createForgeClient({ token: "test-token", baseUrl: API, fetch: forge.fetch });
    const result = await addRepository({ db: context.db, client, clock: context.clock, input: "example-org/alpha-app" });
    expect(result).toMatchObject({ ok: true, value: { key: "example-org/alpha-app", groupId: null } });
  });

  it("refuses an invalid name without calling the forge", async () => {
    const forge = fakeFetch([]);
    const client = createForgeClient({ token: "test-token", baseUrl: API, fetch: forge.fetch });
    expect(await addRepository({ db: context.db, client, clock: context.clock, input: "alpha-app" })).toEqual({
      ok: false,
      error: "projects.name_invalid",
      missing: [],
      owner: null,
    });
    expect(forge.calls).toHaveLength(0);
  });

  it("refuses when no forge access is configured", async () => {
    expect(await addRepository({ db: context.db, client: null, clock: context.clock, input: "example-org/alpha-app" })).toEqual({
      ok: false,
      error: "projects.forge_not_configured",
      missing: [],
      owner: null,
    });
  });

  it("does not save a repository no token finds and names the owner who needs a token", async () => {
    const forge = fakeFetch([{ method: "GET", url: `${API}/repos/example-org/hidden-app`, status: 404, json: { message: "Not Found" } }]);
    const client = createForgeClient({ token: "test-token", baseUrl: API, fetch: forge.fetch });
    expect(await addRepository({ db: context.db, client, clock: context.clock, input: "example-org/hidden-app" })).toEqual({
      ok: false,
      error: "projects.no_token_for_owner",
      missing: ["metadata"],
      owner: "example-org",
    });
    expect(await findRepositories(context.db)).toEqual({ ok: true, value: [] });
  });

  it("refuses a repository that is already watched", async () => {
    for (const expected of [true, false]) {
      const forge = readableForge("example-org/alpha-app");
      const client = createForgeClient({ token: "test-token", baseUrl: API, fetch: forge.fetch });
      const result = await addRepository({ db: context.db, client, clock: context.clock, input: "example-org/alpha-app" });
      expect(result.ok).toBe(expected);
    }
  });

  it("removes a watched repository by the name the owner sees", async () => {
    const forge = readableForge("example-org/alpha-app");
    const client = createForgeClient({ token: "test-token", baseUrl: API, fetch: forge.fetch });
    await addRepository({ db: context.db, client, clock: context.clock, input: "example-org/alpha-app" });
    expect(await removeRepository(context.db, "Example-Org/Alpha-App")).toEqual({ ok: true, value: true });
    expect(await findRepositories(context.db)).toEqual({ ok: true, value: [] });
  });
});
