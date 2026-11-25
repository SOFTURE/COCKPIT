import { describe, expect, it } from "vitest";
import type { ProjectHistory } from "../../src/project-page/history/build-history.ts";
import { buildHistoryTabs } from "../../src/project-page/history/history-tabs.ts";

const BASE = "/projects/example-org/alpha-app/history";
const RUN = { name: "ci", result: "passed", url: "https://forge.example.test/runs/1", createdAt: "2026-11-20T10:00:00Z" } as const;
const MERGE = { number: 3, title: "Change 3", url: "https://forge.example.test/pull/3", mergedAt: "2026-11-20T10:00:00Z", author: "dev", headSha: "abc123" };
const FAILED = { status: "failed", reason: "refused", permission: "contents=read" } as const;

function history(overrides: Partial<ProjectHistory> = {}): ProjectHistory {
  return {
    merges: { status: "ok", value: [MERGE, { ...MERGE, number: 4 }] },
    releases: { status: "ok", value: [] },
    runs: { status: "ok", value: { ci: [RUN, RUN, RUN], ciPullRequest: null, qualityReview: [RUN] } },
    doctor: { status: "ok", value: { kind: "ok", url: null } },
    ...overrides,
  };
}

describe("buildHistoryTabs", () => {
  it("lists CI, Quality review, Merges, Releases and Doctor with their counts and opens CI", () => {
    const result = buildHistoryTabs({ history: history(), basePath: BASE, requested: undefined });
    expect(result.tabs).toEqual([
      { key: "ci", count: 3, href: `${BASE}?tab=ci` },
      { key: "quality-review", count: 1, href: `${BASE}?tab=quality-review` },
      { key: "merges", count: 2, href: `${BASE}?tab=merges` },
      { key: "releases", count: 0, href: `${BASE}?tab=releases` },
      { key: "doctor", count: undefined, href: `${BASE}?tab=doctor` },
    ]);
    expect(result.current).toBe("ci");
  });

  it("opens the requested tab", () => {
    expect(buildHistoryTabs({ history: history(), basePath: BASE, requested: "releases" }).current).toBe("releases");
  });

  it("opens CI for an unknown tab", () => {
    expect(buildHistoryTabs({ history: history(), basePath: BASE, requested: "deploys" }).current).toBe("ci");
  });

  it("shows no count on the tabs of a block that failed to read", () => {
    const result = buildHistoryTabs({ history: history({ runs: FAILED, releases: FAILED }), basePath: BASE, requested: undefined });
    expect(result.tabs.map((tab) => tab.count)).toEqual([undefined, undefined, 2, undefined, undefined]);
  });

  it("counts the doctor's failures by its total, else by the listed findings", () => {
    const finding = { code: "roadmap-left", file: null, message: null };
    const withTotal = history({ doctor: { status: "ok", value: { kind: "failing", url: null, findings: [finding], total: 4 } } });
    const withoutTotal = history({ doctor: { status: "ok", value: { kind: "failing", url: null, findings: [finding, finding], total: null } } });
    expect(buildHistoryTabs({ history: withTotal, basePath: BASE, requested: undefined }).tabs.at(-1)?.count).toBe(4);
    expect(buildHistoryTabs({ history: withoutTotal, basePath: BASE, requested: undefined }).tabs.at(-1)?.count).toBe(2);
  });
});
