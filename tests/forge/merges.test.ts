import { fakeFetch } from "@softure-ai/testing";
import { describe, expect, it } from "vitest";
import { createForgeClient } from "../../src/forge/client.ts";
import { getLatestMerges } from "../../src/forge/merges.ts";
import { TEST_FORGE_API } from "../support/fake-forge-routes.ts";

const PULLS_URL = `${TEST_FORGE_API}/repos/example-org/alpha-app/pulls?state=closed&base=main&sort=updated&direction=desc&per_page=50`;

function pull(number: number, mergedAt: string | null) {
  return { number, title: `Change ${String(number)}`, html_url: `https://forge.example.test/pull/${String(number)}`, merged_at: mergedAt, user: { login: "example-dev" } };
}

async function read(status: number, json: unknown) {
  const forge = fakeFetch([{ method: "GET", url: PULLS_URL, status, json }]);
  const client = createForgeClient({ token: "t", baseUrl: TEST_FORGE_API, fetch: forge.fetch });
  const result = await getLatestMerges(client, "example-org", "alpha-app", "main");
  forge.expectAllUsed();
  return result;
}

describe("getLatestMerges", () => {
  it("keeps only merged pull requests, newest merge first", async () => {
    const result = await read(200, [pull(3, "2026-11-04T10:00:00Z"), pull(4, null), pull(5, "2026-11-06T10:00:00Z")]);
    expect(result).toEqual({
      ok: true,
      value: [
        { number: 5, title: "Change 5", url: "https://forge.example.test/pull/5", mergedAt: "2026-11-06T10:00:00Z", author: "example-dev" },
        { number: 3, title: "Change 3", url: "https://forge.example.test/pull/3", mergedAt: "2026-11-04T10:00:00Z", author: "example-dev" },
      ],
    });
  });

  it("shows at most ten", async () => {
    const pulls = Array.from({ length: 14 }, (_, index) => pull(index + 1, `2026-11-${String(index + 10)}T10:00:00Z`));
    const result = await read(200, pulls);
    expect(result.ok && result.value.map((merge) => merge.number)).toEqual([14, 13, 12, 11, 10, 9, 8, 7, 6, 5]);
  });

  it("is empty when nothing was merged", async () => {
    expect(await read(200, [])).toEqual({ ok: true, value: [] });
  });

  it("passes a refusal on with the permission the forge names", async () => {
    const forge = fakeFetch([
      { method: "GET", url: PULLS_URL, status: 403, json: { message: "Resource not accessible" }, headers: { "x-accepted-github-permissions": "pull_requests=read" } },
    ]);
    const client = createForgeClient({ token: "t", baseUrl: TEST_FORGE_API, fetch: forge.fetch });
    expect(await getLatestMerges(client, "example-org", "alpha-app", "main")).toEqual({ ok: false, kind: "refused", status: 403, acceptedPermissions: "pull_requests=read" });
  });
});
