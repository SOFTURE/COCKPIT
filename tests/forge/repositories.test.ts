import { fakeFetch } from "@softure-ai/testing";
import { describe, expect, it } from "vitest";
import { createForgeClient } from "../../src/forge/client.ts";
import { listReadableRepositories, listReadableRepositoriesOfAll } from "../../src/forge/repositories.ts";
import { TEST_FORGE_API } from "../support/fake-forge-routes.ts";

function pageUrl(page: number) {
  return `${TEST_FORGE_API}/user/repos?per_page=100&sort=full_name&page=${String(page)}`;
}

function repository(fullName: string, archived = false) {
  return { full_name: fullName, archived };
}

describe("listReadableRepositories", () => {
  it("lists every readable repository sorted by name, without archived ones", async () => {
    const forge = fakeFetch([
      { method: "GET", url: pageUrl(1), status: 200, json: [repository("example-org/beta-app"), repository("example-dev/notes", false), repository("example-org/old-app", true), repository("Example-Org/Alpha-App")] },
    ]);
    const client = createForgeClient({ token: "t", baseUrl: TEST_FORGE_API, fetch: forge.fetch });
    expect(await listReadableRepositories(client)).toEqual({ ok: true, value: ["example-dev/notes", "Example-Org/Alpha-App", "example-org/beta-app"] });
    forge.expectAllUsed();
  });

  it("reads the next page while a page is full", async () => {
    const full = Array.from({ length: 100 }, (_, index) => repository(`example-org/app-${String(index).padStart(3, "0")}`));
    const forge = fakeFetch([
      { method: "GET", url: pageUrl(1), status: 200, json: full },
      { method: "GET", url: pageUrl(2), status: 200, json: [repository("example-org/zz-last")] },
    ]);
    const client = createForgeClient({ token: "t", baseUrl: TEST_FORGE_API, fetch: forge.fetch });
    const result = await listReadableRepositories(client);
    expect(result.ok && result.value.length).toBe(101);
    expect(result.ok && result.value.at(-1)).toBe("example-org/zz-last");
    forge.expectAllUsed();
  });

  it("is empty when the token reads no repository", async () => {
    const forge = fakeFetch([{ method: "GET", url: pageUrl(1), status: 200, json: [] }]);
    const client = createForgeClient({ token: "t", baseUrl: TEST_FORGE_API, fetch: forge.fetch });
    expect(await listReadableRepositories(client)).toEqual({ ok: true, value: [] });
  });

  it("passes a failure on", async () => {
    const forge = fakeFetch([{ method: "GET", url: pageUrl(1), status: 401, json: { message: "Bad credentials" } }]);
    const client = createForgeClient({ token: "t", baseUrl: TEST_FORGE_API, fetch: forge.fetch });
    expect(await listReadableRepositories(client)).toEqual({ ok: false, kind: "unauthorized" });
  });
});

describe("listReadableRepositoriesOfAll", () => {
  function clientListing(answer: { status: number; json: unknown }) {
    const forge = fakeFetch([{ method: "GET", url: pageUrl(1), ...answer }]);
    return createForgeClient({ token: "t", baseUrl: TEST_FORGE_API, fetch: forge.fetch });
  }

  it("lists every token's repositories once, sorted by name", async () => {
    const personal = clientListing({ status: 200, json: [repository("example-dev/notes"), repository("example-team/rho-app")] });
    const team = clientListing({ status: 200, json: [repository("Example-Team/Rho-App"), repository("example-team/alpha-app")] });
    expect(await listReadableRepositoriesOfAll([personal, team])).toEqual({ ok: true, value: ["example-dev/notes", "example-team/alpha-app", "example-team/rho-app"] });
  });

  it("keeps the lists that answered when one token fails", async () => {
    const personal = clientListing({ status: 200, json: [repository("example-dev/notes")] });
    const expired = clientListing({ status: 401, json: { message: "Bad credentials" } });
    expect(await listReadableRepositoriesOfAll([expired, personal])).toEqual({ ok: true, value: ["example-dev/notes"] });
  });

  it("fails with the first failure when every list fails", async () => {
    const expired = clientListing({ status: 401, json: { message: "Bad credentials" } });
    const down = clientListing({ status: 503, json: {} });
    expect(await listReadableRepositoriesOfAll([expired, down])).toEqual({ ok: false, kind: "unauthorized" });
  });
});
