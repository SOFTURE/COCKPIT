// The Recent fires card reaches 14 days back and gives each issue one state and its fire time (CT-15).
import { describe, expect, it } from "vitest";
import type { StoredFire } from "../../modules/projects/routines.ts";
import { buildRoutinesTab, getRecentFiresSince } from "../../src/routines/routines-tab.ts";

const NOW = new Date("2026-11-25T12:00:00Z");
const KEY = "example-org/alpha-app";
let nextId = 1;

function makeFire(overrides: Partial<StoredFire> & Pick<StoredFire, "issueNumber" | "createdAt">): StoredFire {
  return {
    id: nextId++,
    repositoryKey: KEY,
    fullName: KEY,
    issueUrl: `https://github.com/${KEY}/issues/${String(overrides.issueNumber)}`,
    issueTitle: `COCKPIT command: issue ${String(overrides.issueNumber)}`,
    routineId: 1,
    routineName: "Coordinator",
    status: "sent",
    httpStatus: 200,
    reason: null,
    attempts: 1,
    nextAttemptAt: null,
    updatedAt: overrides.createdAt,
    ...overrides,
  };
}

function buildIssues(fires: readonly StoredFire[]) {
  return buildRoutinesTab({ routines: [], fires, canStore: true, now: NOW }).issues;
}

describe("the Recent fires window", () => {
  it("starts exactly 14 days before now", () => {
    expect(getRecentFiresSince(NOW)).toEqual(new Date("2026-11-11T12:00:00Z"));
  });

  it("keeps a fire exactly 14 days old and drops one a millisecond older", () => {
    const issues = buildIssues([
      makeFire({ issueNumber: 1, createdAt: new Date("2026-11-11T11:59:59.999Z") }),
      makeFire({ issueNumber: 2, createdAt: new Date("2026-11-11T12:00:00Z") }),
    ]);
    expect(issues.map((issue) => issue.number)).toEqual([2]);
  });

  it("is empty when every fire is older than 14 days", () => {
    expect(buildIssues([makeFire({ issueNumber: 3, createdAt: new Date("2026-10-01T00:00:00Z") })])).toEqual([]);
  });
});

describe("a fired issue", () => {
  it("lists issues newest first with the newest fire's time, which a Retry does not move", () => {
    const issues = buildIssues([
      makeFire({ issueNumber: 4, createdAt: new Date("2026-11-20T08:00:00Z"), updatedAt: new Date("2026-11-24T09:00:00Z") }),
      makeFire({ issueNumber: 5, createdAt: new Date("2026-11-24T10:00:00Z") }),
    ]);
    expect(issues.map((issue) => [issue.number, issue.firedAt.toISOString()])).toEqual([
      [5, "2026-11-24T10:00:00.000Z"],
      [4, "2026-11-20T08:00:00.000Z"],
    ]);
  });

  it("is fired when every routine was fired", () => {
    expect(buildIssues([makeFire({ issueNumber: 6, createdAt: NOW })])[0]?.state).toBe("fired");
  });

  it("is failed when any of its fires failed, and offers Retry", () => {
    const [issue] = buildIssues([
      makeFire({ issueNumber: 7, createdAt: NOW }),
      makeFire({ issueNumber: 7, createdAt: NOW, routineId: 2, routineName: "Reviewer", status: "failed", httpStatus: 503, reason: "server_error" }),
    ]);
    expect(issue?.state).toBe("failed");
    expect(issue?.wake.canRetry).toBe(true);
  });

  it("is pending while a fire is queued or still firing", () => {
    expect(buildIssues([makeFire({ issueNumber: 8, createdAt: NOW, status: "queued", nextAttemptAt: NOW })])[0]?.state).toBe("pending");
    expect(buildIssues([makeFire({ issueNumber: 9, createdAt: NOW, status: "sending" })])[0]?.state).toBe("pending");
  });

  it("is no_routine when the project had no routine to fire", () => {
    const [issue] = buildIssues([makeFire({ issueNumber: 10, createdAt: NOW, routineId: null, routineName: null, status: "no_routine", httpStatus: null })]);
    expect(issue?.state).toBe("no_routine");
  });
});
