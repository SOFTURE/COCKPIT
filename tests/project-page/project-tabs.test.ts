import { describe, expect, it } from "vitest";
import { buildProjectTabs, type ProjectTabsInput } from "../../src/project-page/project-tabs.ts";

const BASE = "/projects/example-org/alpha-app";

function input(overrides: Partial<ProjectTabsInput> = {}): ProjectTabsInput {
  return { basePath: BASE, requested: undefined, entries: 0, roadmaps: 0, changes: 0, hasProduction: false, ...overrides };
}

describe("buildProjectTabs", () => {
  it("counts five entries and one queued roadmap and opens the Waiting tab", () => {
    const result = buildProjectTabs(input({ entries: 5, roadmaps: 1 }));
    expect(result.tabs).toEqual([
      { key: "waiting", count: 5, href: `${BASE}?tab=waiting` },
      { key: "roadmaps", count: 1, href: `${BASE}?tab=roadmaps` },
      { key: "changes", count: 0, href: `${BASE}?tab=changes` },
    ]);
    expect(result.current).toBe("waiting");
  });

  it("opens the first tab with something in it", () => {
    expect(buildProjectTabs(input({ roadmaps: 2 })).current).toBe("roadmaps");
    expect(buildProjectTabs(input({ changes: 3 })).current).toBe("changes");
    expect(buildProjectTabs(input({ hasProduction: true })).current).toBe("production");
  });

  it("opens the Waiting tab when nothing is in any tab", () => {
    expect(buildProjectTabs(input()).current).toBe("waiting");
  });

  it("shows the requested tab when it is available", () => {
    expect(buildProjectTabs(input({ entries: 5, requested: "changes" })).current).toBe("changes");
    expect(buildProjectTabs(input({ entries: 5, hasProduction: true, requested: "production" })).current).toBe("production");
  });

  it("falls back to the default for an unknown or unavailable tab", () => {
    expect(buildProjectTabs(input({ entries: 1, requested: "nope" })).current).toBe("waiting");
    expect(buildProjectTabs(input({ changes: 1, requested: "production" })).current).toBe("changes");
    expect(buildProjectTabs(input({ changes: 1, requested: "" })).current).toBe("changes");
  });

  it("adds Production last, without a count, only when health or deploy reports", () => {
    const result = buildProjectTabs(input({ hasProduction: true }));
    expect(result.tabs.map((tab) => tab.key)).toEqual(["waiting", "roadmaps", "changes", "production"]);
    expect(result.tabs[3]).toEqual({ key: "production", count: undefined, href: `${BASE}?tab=production` });
    expect(buildProjectTabs(input()).tabs.map((tab) => tab.key)).toEqual(["waiting", "roadmaps", "changes"]);
  });

  it("leaves Roadmaps and Changes without a count when no state was read", () => {
    const result = buildProjectTabs(input({ entries: 2, roadmaps: null, changes: null }));
    expect(result.tabs.map((tab) => tab.count)).toEqual([2, undefined, undefined]);
    expect(result.current).toBe("waiting");
  });
});
