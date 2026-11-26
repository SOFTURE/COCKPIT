import { describe, expect, it } from "vitest";
import { createWeekdayTimeFormatter, formatRelativeTime } from "../../src/projects/format-time.ts";

const NOW = new Date("2026-11-27T07:00:00Z");

describe("the planned time with its weekday", () => {
  it("names the weekday, the day and the time in the app's time zone", () => {
    expect(createWeekdayTimeFormatter("en", "Europe/Warsaw")(new Date("2026-11-30T07:00:00Z"))).toBe("Mon, Nov 30, 8:00 AM");
    expect(createWeekdayTimeFormatter("pl", "Europe/Warsaw")(new Date("2026-11-30T07:00:00Z"))).toBe("pon., 30 lis, 8:00");
  });
});

describe("the relative time", () => {
  it("counts whole days from a day away", () => {
    expect(formatRelativeTime("en", new Date("2026-11-30T07:00:00Z"), NOW)).toBe("in 3 days");
    expect(formatRelativeTime("en", new Date("2026-11-28T07:00:00Z"), NOW)).toBe("tomorrow");
    expect(formatRelativeTime("pl", new Date("2026-11-30T07:00:00Z"), NOW)).toBe("za 3 dni");
  });

  it("counts hours under a day and minutes under an hour", () => {
    expect(formatRelativeTime("en", new Date("2026-11-27T12:00:00Z"), NOW)).toBe("in 5 hours");
    expect(formatRelativeTime("en", new Date("2026-11-27T07:25:00Z"), NOW)).toBe("in 25 minutes");
  });

  it("reads a time just passed as moments ago", () => {
    expect(formatRelativeTime("en", new Date("2026-11-27T06:58:00Z"), NOW)).toBe("2 minutes ago");
  });
});
