import { describe, expect, it } from "vitest";
import { getProjectStatus, STALL_THRESHOLD_MS, type ProjectStatusFacts } from "../../src/status/project-status.ts";

const NOW = new Date("2026-11-10T12:00:00Z");
const RECENT = new Date(NOW.getTime() - 60 * 60 * 1000);
const OLD = new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000);

const QUIET: ProjectStatusFacts = { isStateRead: true, hasCiFailed: false, hasDoctorFailed: false, isUnhealthy: false, unansweredCount: 0, hasOpenWork: false, stateUpdatedAt: OLD };

describe("getProjectStatus", () => {
  it("is broken when the state cannot be read", () => {
    expect(getProjectStatus({ ...QUIET, isStateRead: false }, NOW)).toEqual({ status: "broken", brokenReasons: ["state_unreadable"] });
  });

  it("is broken when the last CI run on the main branch failed", () => {
    expect(getProjectStatus({ ...QUIET, hasCiFailed: true }, NOW)).toEqual({ status: "broken", brokenReasons: ["ci_failed"] });
  });

  it("is broken when its doctor fails on the main branch", () => {
    expect(getProjectStatus({ ...QUIET, hasDoctorFailed: true }, NOW)).toEqual({ status: "broken", brokenReasons: ["doctor_failing"] });
  });

  it("is broken when its observability backend reports it unhealthy", () => {
    expect(getProjectStatus({ ...QUIET, isUnhealthy: true }, NOW)).toEqual({ status: "broken", brokenReasons: ["unhealthy"] });
  });

  it("is waiting for you with one unanswered entry", () => {
    expect(getProjectStatus({ ...QUIET, unansweredCount: 1 }, NOW).status).toBe("waiting");
  });

  it("is stalled with open work and no change for longer than the threshold", () => {
    expect(getProjectStatus({ ...QUIET, hasOpenWork: true, stateUpdatedAt: OLD }, NOW).status).toBe("stalled");
  });

  it("is moving with open work changed within the threshold", () => {
    expect(getProjectStatus({ ...QUIET, hasOpenWork: true, stateUpdatedAt: RECENT }, NOW).status).toBe("moving");
  });

  it("is idle with nothing open and nothing waiting, however old", () => {
    expect(getProjectStatus(QUIET, NOW)).toEqual({ status: "idle", brokenReasons: [] });
  });

  it("takes the first status that applies when several do", () => {
    const everything: ProjectStatusFacts = {
      isStateRead: false,
      hasCiFailed: true,
      hasDoctorFailed: true,
      isUnhealthy: true,
      unansweredCount: 2,
      hasOpenWork: true,
      stateUpdatedAt: OLD,
    };
    expect(getProjectStatus(everything, NOW)).toEqual({ status: "broken", brokenReasons: ["state_unreadable", "ci_failed", "doctor_failing", "unhealthy"] });
    expect(getProjectStatus({ ...everything, isStateRead: true, hasCiFailed: false, hasDoctorFailed: false, isUnhealthy: false }, NOW).status).toBe("waiting");
  });

  it("counts exactly the threshold as moving and one millisecond more as stalled", () => {
    const atThreshold = new Date(NOW.getTime() - STALL_THRESHOLD_MS);
    expect(getProjectStatus({ ...QUIET, hasOpenWork: true, stateUpdatedAt: atThreshold }, NOW).status).toBe("moving");
    const past = new Date(atThreshold.getTime() - 1);
    expect(getProjectStatus({ ...QUIET, hasOpenWork: true, stateUpdatedAt: past }, NOW).status).toBe("stalled");
  });

  it("treats open work with no known update time as stalled", () => {
    expect(getProjectStatus({ ...QUIET, hasOpenWork: true, stateUpdatedAt: null }, NOW).status).toBe("stalled");
  });
});
