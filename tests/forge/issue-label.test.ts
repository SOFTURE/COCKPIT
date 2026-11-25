// The label of the issues COCKPIT creates: `cockpit`, and nothing else.
import { describe, expect, it } from "vitest";
import { createForgeClient } from "../../src/forge/client.ts";
import { hasIssueLabel, ISSUE_LABEL } from "../../src/forge/issue-label.ts";
import { TEST_FORGE_API } from "../support/fake-forge-routes.ts";
import { createMemoryForge } from "../support/memory-forge.ts";

const FULL_NAME = "example-org/alpha-app";

function setUp(labels: readonly string[]) {
  const forge = createMemoryForge(FULL_NAME);
  forge.labels = new Set(labels);
  return { forge, client: createForgeClient({ token: "test-token", baseUrl: TEST_FORGE_API, fetch: forge.fetch }) };
}

describe("hasIssueLabel", () => {
  it("names cockpit as the label", () => {
    expect(ISSUE_LABEL).toBe("cockpit");
  });

  it("answers true when the repository has cockpit", async () => {
    expect(await hasIssueLabel(setUp(["cockpit"]).client, "example-org", "alpha-app")).toEqual({ ok: true, value: true });
  });

  it("answers false when the repository has another label only, and never creates a label", async () => {
    const { forge, client } = setUp(["decision"]);
    expect(await hasIssueLabel(client, "example-org", "alpha-app")).toEqual({ ok: true, value: false });
    expect(forge.calls.filter((call) => call.method !== "GET")).toEqual([]);
  });
});

describe("listCockpitIssues", () => {
  it("lists the issues labelled cockpit only, newest first", async () => {
    const { forge, client } = setUp(["cockpit", "decision"]);
    const issue = (number: number, labels: string[]) => ({ number, title: `Issue ${String(number)}`, body: "", labels, state: "open" as const, createdAt: `2026-11-2${String(number)}T08:00:00Z` });
    forge.issues.push(issue(1, ["decision"]), issue(2, ["cockpit"]), issue(3, ["cockpit", "decision"]), issue(4, ["bug"]));
    const listed = await client.listCockpitIssues("example-org", "alpha-app");
    expect(listed.ok && listed.value.map((found) => found.number)).toEqual([3, 2]);
  });
});
