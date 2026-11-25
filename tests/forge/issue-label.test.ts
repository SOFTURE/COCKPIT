// The label of the issues COCKPIT creates: `cockpit`, or the older `owner-word` while a project has only that one.
import { describe, expect, it } from "vitest";
import { createForgeClient } from "../../src/forge/client.ts";
import { findIssueLabel, ISSUE_LABEL, ISSUE_LABELS, LEGACY_ISSUE_LABEL } from "../../src/forge/issue-label.ts";
import { TEST_FORGE_API } from "../support/fake-forge-routes.ts";
import { createMemoryForge } from "../support/memory-forge.ts";

const FULL_NAME = "example-org/alpha-app";

function setUp(labels: readonly string[]) {
  const forge = createMemoryForge(FULL_NAME);
  forge.labels = new Set(labels);
  return { forge, client: createForgeClient({ token: "test-token", baseUrl: TEST_FORGE_API, fetch: forge.fetch }) };
}

describe("findIssueLabel", () => {
  it("names cockpit as the label and owner-word as the older one", () => {
    expect(ISSUE_LABEL).toBe("cockpit");
    expect(LEGACY_ISSUE_LABEL).toBe("owner-word");
    expect(ISSUE_LABELS).toEqual(["cockpit", "owner-word"]);
  });

  it("picks cockpit when the repository has it, also next to owner-word", async () => {
    expect(await findIssueLabel(setUp(["cockpit", "owner-word"]).client, "example-org", "alpha-app")).toEqual({ ok: true, value: "cockpit" });
    expect(await findIssueLabel(setUp(["cockpit"]).client, "example-org", "alpha-app")).toEqual({ ok: true, value: "cockpit" });
  });

  it("falls back to owner-word when the repository has only that one", async () => {
    expect(await findIssueLabel(setUp(["owner-word"]).client, "example-org", "alpha-app")).toEqual({ ok: true, value: "owner-word" });
  });

  it("answers null when the repository has neither, and never creates a label", async () => {
    const { forge, client } = setUp([]);
    expect(await findIssueLabel(client, "example-org", "alpha-app")).toEqual({ ok: true, value: null });
    expect(forge.calls.filter((call) => call.method !== "GET")).toEqual([]);
  });
});

describe("listOwnerWordIssues", () => {
  it("lists issues of both labels once each, newest first", async () => {
    const { forge, client } = setUp(["cockpit", "owner-word"]);
    const issue = (number: number, labels: string[]) => ({ number, title: `Issue ${String(number)}`, body: "", labels, state: "open" as const, createdAt: `2026-11-2${String(number)}T08:00:00Z` });
    forge.issues.push(issue(1, ["owner-word"]), issue(2, ["cockpit"]), issue(3, ["cockpit", "owner-word"]), issue(4, ["bug"]));
    const listed = await client.listOwnerWordIssues("example-org", "alpha-app");
    expect(listed.ok && listed.value.map((found) => found.number)).toEqual([3, 2, 1]);
  });
});
