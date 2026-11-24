import { describe, expect, it } from "vitest";
import { getMessages } from "../../messages/index.ts";
import type { OverviewRun } from "../../src/overview/build-overview.ts";
import { describeRunSource, describeRunWithSource } from "../../src/overview/describe-overview-row.ts";

const formatTime = (date: Date) => date.toISOString().slice(0, 16);
const FROM_PULL: OverviewRun = { kind: "run", result: "failed", url: "https://forge.example.test/run/7", at: "2026-11-10T10:00:00Z", pullRequest: { number: 12, url: "https://forge.example.test/pull/12" } };
const FROM_MAIN: OverviewRun = { kind: "run", result: "passed", url: "https://forge.example.test/run/8", at: "2026-11-10T10:00:00Z", pullRequest: null };

describe("a CI run's source", () => {
  it("names the pull request a run comes from, in English and Polish", () => {
    expect(describeRunSource(getMessages("en").overview, FROM_PULL)).toBe("from PR #12");
    expect(describeRunSource(getMessages("pl").overview, FROM_PULL)).toBe("z PR #12");
  });

  it("names none for a main-branch run or no run", () => {
    expect(describeRunSource(getMessages("en").overview, FROM_MAIN)).toBeNull();
    expect(describeRunSource(getMessages("en").overview, { kind: "none" })).toBeNull();
  });

  it("appends the source to the terminal's wording", () => {
    const copy = getMessages("en").overview;
    expect(describeRunWithSource(copy, copy.ci, FROM_PULL, formatTime)).toBe("CI failed 2026-11-10T10:00 · from PR #12");
    expect(describeRunWithSource(copy, copy.ci, FROM_MAIN, formatTime)).toBe("CI passed 2026-11-10T10:00");
  });
});
