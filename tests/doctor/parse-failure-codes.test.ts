import { describe, expect, it } from "vitest";
import { countFailures, parseFailureCodes } from "../../src/doctor/parse-failure-codes.ts";

describe("parseFailureCodes", () => {
  it("reads nothing from an empty message", () => {
    expect(parseFailureCodes("")).toEqual([]);
    expect(parseFailureCodes(" , ")).toEqual([]);
  });

  it("reads one code with its count", () => {
    expect(parseFailureCodes("roadmap.stale (2)")).toEqual([{ code: "roadmap.stale", count: 2 }]);
  });

  it("reads several codes in the order listed", () => {
    expect(parseFailureCodes("archive.unstamped (1), roadmap.stale (3), state.drift (1)")).toEqual([
      { code: "archive.unstamped", count: 1 },
      { code: "roadmap.stale", count: 3 },
      { code: "state.drift", count: 1 },
    ]);
  });

  it("counts a code without a count once and never counts zero", () => {
    expect(parseFailureCodes("state.missing, index.broken (0)")).toEqual([
      { code: "state.missing", count: 1 },
      { code: "index.broken", count: 1 },
    ]);
  });
});

describe("countFailures", () => {
  it("adds the counts up", () => {
    expect(countFailures([])).toBe(0);
    expect(countFailures([{ code: "a", count: 2 }, { code: "b", count: 1 }])).toBe(3);
  });
});
