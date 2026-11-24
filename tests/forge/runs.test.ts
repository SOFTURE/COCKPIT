import { describe, expect, it } from "vitest";
import { findLastCiRun, findLastQualityReview, isCiRun, isPullRequestCiRun, isQualityReviewRun, summarizePullRequestCi, summarizeRun, type WorkflowRun } from "../../src/forge/runs.ts";

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

describe("a pull request's CI", () => {
  const checks = (overrides: Partial<WorkflowRun>) => run({ name: "checks", path: ".github/workflows/checks.yml", ...overrides });

  it("counts every workflow but the quality review and the deploy", () => {
    expect(isPullRequestCiRun(run({}))).toBe(true);
    expect(isPullRequestCiRun(checks({}))).toBe(true);
    expect(isPullRequestCiRun(run({ name: "tests", path: ".github/workflows/tests.yml" }))).toBe(true);
    expect(isPullRequestCiRun(run({ name: "quality-review", path: ".github/workflows/quality-review.yml" }))).toBe(false);
    expect(isPullRequestCiRun(run({ name: "deploy", path: ".github/workflows/deploy.yml" }))).toBe(false);
    expect(isPullRequestCiRun(run({ name: "Deploy", path: "" }))).toBe(false);
  });

  it("is failed when any counted workflow failed, linking that run, at the newest change", () => {
    const summary = summarizePullRequestCi([
      run({ url: "ci", updatedAt: "2026-11-05T10:20:00Z" }),
      checks({ conclusion: "failure", url: "checks", createdAt: "2026-11-05T09:00:00Z", updatedAt: "2026-11-05T09:30:00Z" }),
    ]);
    expect(summary).toEqual({ result: "failed", url: "checks", at: "2026-11-05T10:20:00Z" });
  });

  it("is passed when every counted workflow passed, linking the newest run", () => {
    const summary = summarizePullRequestCi([
      run({ url: "ci", createdAt: "2026-11-05T09:00:00Z" }),
      checks({ url: "checks", createdAt: "2026-11-05T11:00:00Z", updatedAt: "2026-11-05T11:05:00Z" }),
    ]);
    expect(summary).toEqual({ result: "passed", url: "checks", at: "2026-11-05T11:05:00Z" });
  });

  it("ignores a failed deploy, a failed quality review and a run still going", () => {
    const summary = summarizePullRequestCi([
      run({ url: "ci" }),
      run({ name: "deploy", path: ".github/workflows/deploy.yml", conclusion: "failure", url: "deploy" }),
      run({ name: "quality-review", path: ".github/workflows/quality-review.yml", conclusion: "failure", url: "qr" }),
      checks({ isCompleted: false, conclusion: null, url: "checks-running" }),
    ]);
    expect(summary).toEqual({ result: "passed", url: "ci", at: "2026-11-05T10:10:00Z" });
  });

  it("lets a rerun replace its failed attempt", () => {
    const summary = summarizePullRequestCi([
      run({ conclusion: "failure", url: "first", createdAt: "2026-11-05T09:00:00Z", updatedAt: "2026-11-05T09:10:00Z" }),
      run({ url: "rerun", createdAt: "2026-11-05T10:00:00Z", updatedAt: "2026-11-05T10:10:00Z" }),
    ]);
    expect(summary).toEqual({ result: "passed", url: "rerun", at: "2026-11-05T10:10:00Z" });
  });

  it("is cancelled when nothing failed but a workflow was cancelled", () => {
    expect(summarizePullRequestCi([run({ url: "ci" }), checks({ conclusion: "cancelled", url: "checks" })])?.result).toBe("cancelled");
  });

  it("is null when no counted workflow finished", () => {
    expect(summarizePullRequestCi([])).toBeNull();
    expect(summarizePullRequestCi([run({ isCompleted: false, conclusion: null })])).toBeNull();
    expect(summarizePullRequestCi([run({ name: "deploy", path: ".github/workflows/deploy.yml" })])).toBeNull();
  });
});
