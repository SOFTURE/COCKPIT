// NFR-7: toward watched repositories COCKPIT makes no write other than creating owner-word issues.
import { fakeFetch } from "@softure-ai/testing";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createForgeClient, type ForgeClient } from "../../src/forge/client.ts";
import { formatOwnerWordIssue } from "../../src/forge/issues.ts";
import { TEST_FORGE_API } from "../support/fake-forge-routes.ts";

/** Every method of the client, called once; a new method fails the type check here until it is added. */
const EVERY_METHOD: { readonly [K in keyof ForgeClient]: (client: ForgeClient) => unknown } = {
  getRepository: (client) => client.getRepository("example-org", "alpha-app"),
  probe: (client) => client.probe("/repos/example-org/alpha-app/pulls?per_page=1"),
  getJson: (client) => client.getJson("/repos/example-org/alpha-app/releases/latest", z.unknown()),
  getJsonFile: (client) => client.getJsonFile("example-org", "alpha-app", "context/state.json", "main"),
  listOwnerWordIssues: (client) => client.listOwnerWordIssues("example-org", "alpha-app"),
  hasLabel: (client) => client.hasLabel("example-org", "alpha-app", "owner-word"),
  createIssue: (client) =>
    client.createIssue(
      "example-org",
      "alpha-app",
      formatOwnerWordIssue({ id: "oq-1", kind: "decision", source: "context/foundation/roadmap.md", item: null, since: null, text: "Pick one" }, "yes", null),
    ),
  getBudget: (client) => client.getBudget(),
};

describe("the forge client", () => {
  it("writes nothing but one owner-word issue, whatever is called", async () => {
    const forge = fakeFetch([{ url: /.*/, repeat: true, status: 200, json: {} }]);
    const client = createForgeClient({ token: "test-token", baseUrl: TEST_FORGE_API, fetch: forge.fetch });

    for (const call of Object.values(EVERY_METHOD)) {
      await call(client);
    }

    const writes = forge.calls.filter((call) => call.method !== "GET");
    expect(writes.map((call) => `${call.method} ${call.url}`)).toEqual([`POST ${TEST_FORGE_API}/repos/example-org/alpha-app/issues`]);
    expect(writes[0]?.json).toMatchObject({ labels: ["owner-word"] });
  });
});
