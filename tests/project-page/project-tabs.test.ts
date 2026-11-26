import { describe, expect, it } from "vitest";
import { buildProjectTabs, type ProjectTabsInput } from "../../src/project-page/project-tabs.ts";

const BASE = "/projects/example-org/alpha-app";

function input(overrides: Partial<ProjectTabsInput> = {}): ProjectTabsInput {
  return { basePath: BASE, requested: undefined, entries: 0, roadmaps: 0, changes: 0, routines: 0, hasProduction: false, ...overrides };
}

describe("buildProjectTabs", () => {
  it("counts five entries and one queued roadmap and opens the Waiting tab", () => {
    const result = buildProjectTabs(input({ entries: 5, roadmaps: 1 }));
    expect(result.tabs).toEqual([
      { key: "waiting", count: 5, href: `${BASE}?tab=waiting` },
      { key: "roadmaps", count: 1, href: `${BASE}?tab=roadmaps` },
      { key: "changes", count: 0, href: `${BASE}?tab=changes` },
      { key: "routines", count: 0, href: `${BASE}?tab=routines` },
      { key: "settings", count: undefined, href: `${BASE}?tab=settings` },
    ]);
    expect(result.current).toBe("waiting");
  });

  it("shows the Routines tab with its count but never opens it unasked (CT-10)", () => {
    expect(buildProjectTabs(input({ routines: 2 })).current).toBe("waiting");
    expect(buildProjectTabs(input({ routines: 2, requested: "routines" })).current).toBe("routines");
  });

  it("opens Waiting whatever the other tabs hold (CT-29)", () => {
    const combinations: readonly Partial<ProjectTabsInput>[] = [
      {},
      { entries: 3 },
      { roadmaps: 2 },
      { changes: 3 },
      { routines: 2 },
      { hasProduction: true },
      { entries: 0, roadmaps: 2, changes: 3, routines: 1, hasProduction: true },
      { entries: 4, roadmaps: 2, changes: 3, routines: 1, hasProduction: true },
    ];
    for (const overrides of combinations) {
      expect(buildProjectTabs(input(overrides)).current).toBe("waiting");
    }
  });

  it("opens the Waiting tab when nothing is in any tab", () => {
    expect(buildProjectTabs(input()).current).toBe("waiting");
  });

  it("shows the requested tab when it is available", () => {
    const everything = { entries: 1, roadmaps: 1, changes: 1, routines: 1, hasProduction: true };
    for (const key of ["waiting", "roadmaps", "changes", "routines", "production", "settings"]) {
      expect(buildProjectTabs(input({ ...everything, requested: key })).current).toBe(key);
    }
  });

  it("falls back to Waiting for an unknown, empty or unavailable tab", () => {
    expect(buildProjectTabs(input({ entries: 1, requested: "nope" })).current).toBe("waiting");
    expect(buildProjectTabs(input({ changes: 1, requested: "production" })).current).toBe("waiting");
    expect(buildProjectTabs(input({ changes: 1, hasProduction: true, requested: "" })).current).toBe("waiting");
  });

  it("adds Production before Settings, without a count, only when health or deploy reports", () => {
    const result = buildProjectTabs(input({ hasProduction: true }));
    expect(result.tabs.map((tab) => tab.key)).toEqual(["waiting", "roadmaps", "changes", "routines", "production", "settings"]);
    expect(result.tabs[4]).toEqual({ key: "production", count: undefined, href: `${BASE}?tab=production` });
    expect(buildProjectTabs(input()).tabs.map((tab) => tab.key)).toEqual(["waiting", "roadmaps", "changes", "routines", "settings"]);
  });

  it("always ends with Settings, without a count, and opens it only on request (CT-31)", () => {
    for (const hasProduction of [false, true]) {
      for (const overrides of [{}, { entries: 0, roadmaps: null, changes: null }, { entries: 3, routines: 2 }]) {
        const result = buildProjectTabs(input({ ...overrides, hasProduction }));
        expect(result.tabs.at(-1)).toEqual({ key: "settings", count: undefined, href: `${BASE}?tab=settings` });
        expect(result.current).toBe("waiting");
      }
    }
    expect(buildProjectTabs(input({ requested: "settings" })).current).toBe("settings");
  });

  it("leaves Roadmaps and Changes without a count when no state was read", () => {
    const result = buildProjectTabs(input({ entries: 2, roadmaps: null, changes: null }));
    expect(result.tabs.map((tab) => tab.count)).toEqual([2, undefined, undefined, 0, undefined]);
    expect(result.current).toBe("waiting");
  });
});
