// The scheduled task dialog's rules (CT-38): a new task starts tomorrow 08:00 with nothing picked, the quick times,
// a stored time back in the inputs, the hint under the time, the counters and the field each error names.
import { describe, expect, it } from "vitest";
import {
  getCounter,
  getDefaultRunAt,
  getErrorField,
  getQuickTimes,
  getRunAtInstant,
  getRunHint,
  joinRunAt,
  splitRunAt,
  TITLE_COUNTER_FROM,
} from "../../src/scheduled/scheduled-task-form-state.ts";

const ZONE = "Europe/Warsaw";
// Thursday 26 November 2026, 14:30 in Warsaw (UTC+1).
const THURSDAY = new Date("2026-11-26T13:30:00Z");

describe("the default time and the quick times", () => {
  it("starts a new task tomorrow at 08:00 in the app's zone", () => {
    expect(getDefaultRunAt(THURSDAY, ZONE)).toEqual({ date: "2026-11-27", time: "08:00" });
  });

  it("reads tomorrow in the app's zone, not in UTC", () => {
    // 23:30 UTC on the 26th is already the 27th in Warsaw.
    expect(getDefaultRunAt(new Date("2026-11-26T23:30:00Z"), ZONE)).toEqual({ date: "2026-11-28", time: "08:00" });
  });

  it("offers tomorrow and the next Monday at 08:00", () => {
    expect(getQuickTimes(THURSDAY, ZONE)).toEqual({
      tomorrow: { date: "2026-11-27", time: "08:00" },
      monday: { date: "2026-11-30", time: "08:00" },
    });
  });

  it("takes the Monday a week ahead on a Monday and the next day on a Sunday", () => {
    expect(getQuickTimes(new Date("2026-11-30T09:00:00Z"), ZONE).monday).toEqual({ date: "2026-12-07", time: "08:00" });
    expect(getQuickTimes(new Date("2026-11-29T09:00:00Z"), ZONE).monday).toEqual({ date: "2026-11-30", time: "08:00" });
  });
});

describe("a stored time in the inputs", () => {
  it("splits an instant into the local date and time and joins them back", () => {
    const fields = splitRunAt(new Date("2026-11-30T07:05:00Z"), ZONE);
    expect(fields).toEqual({ date: "2026-11-30", time: "08:05" });
    expect(joinRunAt(fields)).toBe("2026-11-30T08:05");
  });

  it("reads the instant back, or nothing while a field is incomplete or not a real day", () => {
    expect(getRunAtInstant({ date: "2026-11-30", time: "08:05" }, ZONE)?.toISOString()).toBe("2026-11-30T07:05:00.000Z");
    expect(getRunAtInstant({ date: "", time: "08:00" }, ZONE)).toBeNull();
    expect(getRunAtInstant({ date: "2026-11-30", time: "" }, ZONE)).toBeNull();
    expect(getRunAtInstant({ date: "2026-04-31", time: "08:00" }, ZONE)).toBeNull();
    expect(getRunAtInstant({ date: "2026-11-30", time: "24:00" }, ZONE)).toBeNull();
  });
});

describe("the hint under the time", () => {
  it("names the zone and how far away the time is", () => {
    expect(getRunHint({ fields: { date: "2026-11-29", time: "14:30" }, now: THURSDAY, timeZone: ZONE, locale: "en" })).toBe("Europe/Warsaw · in 3 days");
    expect(getRunHint({ fields: { date: "2026-11-26", time: "16:30" }, now: THURSDAY, timeZone: ZONE, locale: "pl" })).toBe("Europe/Warsaw · za 2 godziny");
  });

  it("names the zone alone while the time is incomplete", () => {
    expect(getRunHint({ fields: { date: "2026-11-29", time: "" }, now: THURSDAY, timeZone: ZONE, locale: "en" })).toBe("Europe/Warsaw");
  });
});

describe("the counters", () => {
  it("shows the title's counter only near its limit and the prompt's always", () => {
    expect(getCounter(159, 200, TITLE_COUNTER_FROM)).toBeNull();
    expect(getCounter(160, 200, TITLE_COUNTER_FROM)).toBe("160 / 200");
    expect(getCounter(0, 10_000)).toBe("0 / 10000");
  });
});

describe("the field an error names", () => {
  it("puts each error under its own field", () => {
    expect(getErrorField("scheduled.title_missing")).toBe("title");
    expect(getErrorField("scheduled.title_too_long")).toBe("title");
    expect(getErrorField("scheduled.prompt_missing")).toBe("prompt");
    expect(getErrorField("scheduled.prompt_too_long")).toBe("prompt");
    expect(getErrorField("scheduled.time_invalid")).toBe("when");
    expect(getErrorField("scheduled.time_past")).toBe("when");
    expect(getErrorField("scheduled.no_projects")).toBe("projects");
    expect(getErrorField("scheduled.project_not_watched")).toBe("projects");
  });

  it("names no field for an error about the whole task", () => {
    expect(getErrorField("scheduled.storage_failed")).toBeNull();
    expect(getErrorField("scheduled.not_editable")).toBeNull();
    expect(getErrorField("scheduled.not_found")).toBeNull();
  });
});
