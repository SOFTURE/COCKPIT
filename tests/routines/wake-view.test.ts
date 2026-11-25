import { describe, expect, it } from "vitest";
import type { StoredFire } from "../../modules/projects/routines.ts";
import { getIssueWake } from "../../src/routines/wake-view.ts";

const AT = new Date("2026-11-25T10:00:00Z");
const ALPHA = "example-org/alpha-app";

function fire(values: Partial<StoredFire>): StoredFire {
  return {
    id: 1,
    repositoryKey: ALPHA,
    fullName: ALPHA,
    issueNumber: 4,
    issueUrl: `https://forge.example.test/${ALPHA}/issues/4`,
    issueTitle: "COCKPIT command: Run the doctor",
    routineId: 1,
    routineName: "Coordinator",
    status: "sent",
    httpStatus: 200,
    reason: null,
    attempts: 1,
    nextAttemptAt: null,
    createdAt: AT,
    updatedAt: AT,
    ...values,
  };
}

describe("getIssueWake", () => {
  it("lists one issue's fires and offers Retry only when one did not go through", () => {
    expect(getIssueWake([fire({})], ALPHA, 4)).toMatchObject({ issueNumber: 4, canRetry: false, fires: [{ routineName: "Coordinator", status: "sent" }] });
    for (const status of ["failed", "queued", "no_routine"] as const) {
      expect(getIssueWake([fire({}), fire({ id: 2, status })], ALPHA, 4)?.canRetry).toBe(true);
    }
    expect(getIssueWake([fire({ status: "sending" })], ALPHA, 4)?.canRetry).toBe(false);
  });

  it("answers null for an issue without recorded fires", () => {
    expect(getIssueWake([fire({})], ALPHA, 5)).toBeNull();
    expect(getIssueWake([fire({})], "example-org/beta-app", 4)).toBeNull();
  });
});
