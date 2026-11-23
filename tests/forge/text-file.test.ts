import { fakeFetch } from "@softure-ai/testing";
import { describe, expect, it } from "vitest";
import { createForgeClient } from "../../src/forge/client.ts";
import { getTextFile } from "../../src/forge/text-file.ts";
import { TEST_FORGE_API } from "../support/fake-forge-routes.ts";

const QUERY = { owner: "example-org", name: "alpha-app", path: "context/foundation/roadmaps/alpha v2.md", ref: "main" };

describe("getTextFile", () => {
  it("decodes the base64 content of the contents answer, line breaks included", async () => {
    const encoded = Buffer.from("# Roadmap \u00e9t\u00e9 \u2713\n- **Status:** ready\n", "utf8").toString("base64");
    const forge = fakeFetch([{ url: /contents/, status: 200, json: { type: "file", encoding: "base64", content: `${encoded.slice(0, 10)}\n${encoded.slice(10)}` } }]);
    const client = createForgeClient({ token: "test-token", baseUrl: TEST_FORGE_API, fetch: forge.fetch });

    const file = await getTextFile(client, QUERY);

    expect(file).toEqual({ ok: true, value: "# Roadmap \u00e9t\u00e9 \u2713\n- **Status:** ready\n" });
    expect(forge.calls[0]?.url).toBe(`${TEST_FORGE_API}/repos/example-org/alpha-app/contents/context/foundation/roadmaps/alpha%20v2.md?ref=main`);
  });

  it("passes a missing file through as not_found", async () => {
    const forge = fakeFetch([{ url: /contents/, status: 404, json: { message: "Not Found" } }]);
    const client = createForgeClient({ token: "test-token", baseUrl: TEST_FORGE_API, fetch: forge.fetch });

    expect(await getTextFile(client, QUERY)).toEqual({ ok: false, kind: "not_found" });
  });

  it("reads a directory answer as an invalid answer", async () => {
    const forge = fakeFetch([{ url: /contents/, status: 200, json: [{ type: "file" }] }]);
    const client = createForgeClient({ token: "test-token", baseUrl: TEST_FORGE_API, fetch: forge.fetch });

    expect(await getTextFile(client, QUERY)).toEqual({ ok: false, kind: "invalid_answer" });
  });
});
