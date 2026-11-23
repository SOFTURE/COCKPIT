import { fakeFetch } from "@softure-ai/testing";
import { describe, expect, it } from "vitest";
import { createForgeClient } from "../../src/forge/client.ts";
import { getLatestReleases } from "../../src/forge/releases.ts";
import { TEST_FORGE_API } from "../support/fake-forge-routes.ts";

const RELEASES_URL = `${TEST_FORGE_API}/repos/example-org/alpha-app/releases?per_page=10`;

function release(tag: string, publishedAt: string | null, extra: Record<string, unknown> = {}) {
  return { tag_name: tag, name: tag, html_url: `https://forge.example.test/releases/${tag}`, published_at: publishedAt, draft: false, prerelease: false, ...extra };
}

async function read(status: number, json: unknown) {
  const forge = fakeFetch([{ method: "GET", url: RELEASES_URL, status, json }]);
  const client = createForgeClient({ token: "t", baseUrl: TEST_FORGE_API, fetch: forge.fetch });
  const result = await getLatestReleases(client, "example-org", "alpha-app");
  forge.expectAllUsed();
  return result;
}

describe("getLatestReleases", () => {
  it("drops drafts, marks prereleases and keeps a title other than the tag", async () => {
    const result = await read(200, [
      release("v1.3.0", null, { draft: true }),
      release("v1.2.0-rc.1", "2026-11-05T10:00:00Z", { prerelease: true }),
      release("v1.1.0", "2026-11-01T10:00:00Z", { name: "Search" }),
    ]);
    expect(result).toEqual({
      ok: true,
      value: [
        { version: "v1.2.0-rc.1", title: null, url: "https://forge.example.test/releases/v1.2.0-rc.1", publishedAt: "2026-11-05T10:00:00Z", isPrerelease: true },
        { version: "v1.1.0", title: "Search", url: "https://forge.example.test/releases/v1.1.0", publishedAt: "2026-11-01T10:00:00Z", isPrerelease: false },
      ],
    });
  });

  it("shows at most five, newest first", async () => {
    const releases = Array.from({ length: 8 }, (_, index) => release(`v1.${String(index)}.0`, `2026-11-0${String(index + 1)}T10:00:00Z`));
    const result = await read(200, releases);
    expect(result.ok && result.value.map((entry) => entry.version)).toEqual(["v1.7.0", "v1.6.0", "v1.5.0", "v1.4.0", "v1.3.0"]);
  });

  it("is empty for a repository without releases", async () => {
    expect(await read(200, [])).toEqual({ ok: true, value: [] });
  });

  it("passes a failure on", async () => {
    expect(await read(404, { message: "Not Found" })).toEqual({ ok: false, kind: "not_found" });
  });
});
