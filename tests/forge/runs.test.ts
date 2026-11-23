import { describe, expect, it } from "vitest";
import { findLastCiRun, findLastQualityReview, isCiRun, isQualityReviewRun, summarizeRun, type WorkflowRun } from "../../src/forge/runs.ts";

function run(overrides: Partial<WorkflowRun>): WorkflowRun {
  return {
    id: 1,
    headSha: "abc123",
    name: "ci",
    path: ".github/workflows/ci.yml",
    isCompleted: true,
    conclusion: "success",
    url: "https://forge.example.test/run",
    createdAt: "2026-11-05T10:00:00Z",
    updatedAt: "2026-11-05T10:10:00Z",
    ...overrides,
  };
}

describe("workflow run picking", () => {
  it("recognises CI by its workflow file, with or without a ref suffix, or by name", () => {
    expect(isCiRun(run({}))).toBe(true);
    expect(isCiRun(run({ path: ".github/workflows/ci.yaml@refs/heads/main" }))).toBe(true);
    expect(isCiRun(run({ path: "", name: "CI" }))).toBe(true);
    expect(isCiRun(run({ path: ".github/workflows/ci-usage.yml", name: "ci-usage" }))).toBe(false);
    expect(isCiRun(run({ path: ".github/workflows/quality-review.yml", name: "quality-review" }))).toBe(false);
  });

  it("recognises both quality-review workflows", () => {
    expect(isQualityReviewRun(run({ path: ".github/workflows/quality-review.yml", name: "quality-review" }))).toBe(true);
    expect(isQualityReviewRun(run({ path: ".github/workflows/qr.yml", name: "quality-review-packages" }))).toBe(true);
    expect(isQualityReviewRun(run({}))).toBe(false);
  });

  it("takes the newest completed CI run, skipping one still running", () => {
    const runs = [
      run({ createdAt: "2026-11-06T10:00:00Z", isCompleted: false, conclusion: null, url: "https://forge.example.test/running" }),
      run({ createdAt: "2026-11-05T10:00:00Z", conclusion: "failure", url: "https://forge.example.test/failed" }),
      run({ createdAt: "2026-11-04T10:00:00Z", conclusion: "success", url: "https://forge.example.test/passed" }),
      run({ createdAt: "2026-11-07T10:00:00Z", name: "ci-usage", path: ".github/workflows/ci-usage.yml" }),
    ];
    expect(findLastCiRun(runs)).toEqual({ result: "failed", url: "https://forge.example.test/failed", at: "2026-11-05T10:10:00Z" });
  });

  it("takes the newest quality review even while it runs", () => {
    const runs = [
      run({ name: "quality-review", path: ".github/workflows/quality-review.yml", createdAt: "2026-11-01T10:00:00Z" }),
      run({ name: "quality-review", path: ".github/workflows/quality-review.yml", createdAt: "2026-11-08T10:00:00Z", isCompleted: false, conclusion: null }),
    ];
    expect(findLastQualityReview(runs)?.result).toBe("running");
  });

  it("finds nothing in an empty list", () => {
    expect(findLastCiRun([])).toBeNull();
    expect(findLastQualityReview([])).toBeNull();
  });

  it("maps conclusions to results", () => {
    expect(["success", "neutral", "skipped", "failure", "timed_out", "startup_failure", "cancelled", null].map((conclusion) => summarizeRun(run({ conclusion })).result)).toEqual([
      "passed",
      "passed",
      "passed",
      "failed",
      "failed",
      "failed",
      "cancelled",
      "cancelled",
    ]);
  });
});
