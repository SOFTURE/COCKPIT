import { describe, expect, it } from "vitest";
import { getNextRunAt } from "../../src/scheduled/next-run-at.ts";

const ZONE = "Europe/Warsaw";

function next(plannedAt: string, repeat: "none" | "daily" | "weekly", now = plannedAt) {
  return getNextRunAt({ plannedAt: new Date(plannedAt), repeat, now: new Date(now), timeZone: ZONE })?.toISOString() ?? null;
}

describe("getNextRunAt", () => {
  it("gives a one-off task no next time", () => {
    expect(next("2026-11-02T07:00:00.000Z", "none")).toBeNull();
  });

  it("plans a daily task for the next day at the same local time", () => {
    // 08:00 in Warsaw, claimed half a minute late.
    expect(next("2026-11-02T07:00:00.000Z", "daily", "2026-11-02T07:00:30.000Z")).toBe("2026-11-03T07:00:00.000Z");
  });

  it("plans a weekly task for the same weekday a week later", () => {
    expect(next("2026-11-02T07:00:00.000Z", "weekly", "2026-11-02T07:00:30.000Z")).toBe("2026-11-09T07:00:00.000Z");
  });

  it("keeps 08:00 across the spring DST change (29 March 2026)", () => {
    // Saturday 28 March 08:00 CET (UTC+1) → Sunday 08:00 CEST (UTC+2); a week later Saturday 4 April 08:00 CEST.
    expect(next("2026-03-28T07:00:00.000Z", "daily")).toBe("2026-03-29T06:00:00.000Z");
    expect(next("2026-03-28T07:00:00.000Z", "weekly")).toBe("2026-04-04T06:00:00.000Z");
  });

  it("keeps 08:00 across the autumn DST change (25 October 2026)", () => {
    // Saturday 24 October 08:00 CEST (UTC+2) → Sunday 08:00 CET (UTC+1); Monday 19 October → Monday 26 October.
    expect(next("2026-10-24T06:00:00.000Z", "daily")).toBe("2026-10-25T07:00:00.000Z");
    expect(next("2026-10-19T06:00:00.000Z", "weekly")).toBe("2026-10-26T07:00:00.000Z");
  });

  it("fires a run missed by several periods once: the next time comes after now", () => {
    // Planned Monday 2 November 08:00, claimed on Friday 20 November: the next Monday after now, not 9 November.
    expect(next("2026-11-02T07:00:00.000Z", "weekly", "2026-11-20T12:00:00.000Z")).toBe("2026-11-23T07:00:00.000Z");
    expect(next("2026-11-02T07:00:00.000Z", "daily", "2026-11-20T12:00:00.000Z")).toBe("2026-11-21T07:00:00.000Z");
  });

  it("never gives a time equal to now", () => {
    expect(next("2026-11-02T07:00:00.000Z", "weekly", "2026-11-09T07:00:00.000Z")).toBe("2026-11-16T07:00:00.000Z");
  });
});
