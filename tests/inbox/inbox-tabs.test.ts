import { describe, expect, it } from "vitest";
import type { InboxRow } from "../../src/inbox/build-inbox.ts";
import { buildInboxTabs, getProjectTabLabels } from "../../src/inbox/inbox-tabs.ts";

function row(projectName: string, id: string, deferred = false): InboxRow {
  return {
    projectKey: projectName.toLowerCase(),
    projectName,
    entry: { id, kind: "decision", source: "context/roadmap.md", since: null, item: null, text: id },
    ageDays: null,
    answer: deferred ? { kind: "deferred", issueNumber: 7, issueUrl: null } : { kind: "open" },
    previousAnswer: null,
  };
}

describe("getProjectTabLabels", () => {
  it("uses the initials of the repository name's words, without the owner", () => {
    const labels = getProjectTabLabels(["example-org/ORDER_TRACKER", "example-org/vault-connector", "example-org/site.web"]);
    expect(labels.get("example-org/ORDER_TRACKER")).toBe("OT");
    expect(labels.get("example-org/vault-connector")).toBe("VC");
    expect(labels.get("example-org/site.web")).toBe("SW");
  });

  it("uses the repository name for a one-word name", () => {
    expect(getProjectTabLabels(["example-org/ASSISTANT"]).get("example-org/ASSISTANT")).toBe("ASSISTANT");
  });

  it("uses the repository name for every project whose code would repeat", () => {
    const labels = getProjectTabLabels(["example-org/alpha-app", "example-org/apex-api", "example-org/beta-app"]);
    expect(labels.get("example-org/alpha-app")).toBe("alpha-app");
    expect(labels.get("example-org/apex-api")).toBe("apex-api");
    expect(labels.get("example-org/beta-app")).toBe("BA");
  });

  it("returns no labels for no projects", () => {
    expect(getProjectTabLabels([]).size).toBe(0);
  });
});

describe("buildInboxTabs", () => {
  const rows = [
    row("example-org/ORDER_TRACKER", "f1"),
    row("example-org/SAMPLE_SITE", "a1"),
    row("example-org/ORDER_TRACKER", "f2"),
    row("example-org/ROUTE_PLAN", "t1", true),
  ];

  it("lists All first, then one tab per project ordered by label, counting entries waiting", () => {
    const result = buildInboxTabs({ basePath: "/inbox", requested: undefined, rows });
    expect(result.tabs).toEqual([
      { key: "all", label: null, projectName: null, count: 3, href: "/inbox" },
      { key: "example-org/ORDER_TRACKER", label: "OT", projectName: "example-org/ORDER_TRACKER", count: 2, href: "/inbox?project=example-org/ORDER_TRACKER" },
      { key: "example-org/ROUTE_PLAN", label: "RP", projectName: "example-org/ROUTE_PLAN", count: 0, href: "/inbox?project=example-org/ROUTE_PLAN" },
      { key: "example-org/SAMPLE_SITE", label: "SS", projectName: "example-org/SAMPLE_SITE", count: 1, href: "/inbox?project=example-org/SAMPLE_SITE" },
    ]);
    expect(result.current).toBe("all");
  });

  it("shows the requested project when it has a tab", () => {
    expect(buildInboxTabs({ basePath: "/inbox", requested: "example-org/ROUTE_PLAN", rows }).current).toBe("example-org/ROUTE_PLAN");
  });

  it("falls back to All for an unknown, empty or other-owner project", () => {
    expect(buildInboxTabs({ basePath: "/inbox", requested: "example-org/NOPE", rows }).current).toBe("all");
    expect(buildInboxTabs({ basePath: "/inbox", requested: "", rows }).current).toBe("all");
    expect(buildInboxTabs({ basePath: "/inbox", requested: "all", rows }).current).toBe("all");
  });

  it("has only the All tab when nothing waits", () => {
    expect(buildInboxTabs({ basePath: "/inbox", requested: undefined, rows: [] })).toEqual({
      tabs: [{ key: "all", label: null, projectName: null, count: 0, href: "/inbox" }],
      current: "all",
    });
  });
});
