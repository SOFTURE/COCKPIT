// When a repeating scheduled task runs next (CT-39): the first point `planned + k periods` (k ≥ 1) on the planned
// time's local wall clock that comes after both the planned time and now. Counting on the wall clock in the app's zone
// keeps 08:00 at 08:00 across a DST change; counting past now makes a run missed by several periods fire once.
import { addCalendarDays, calendarDaysBetween, getWallClock, getZonedInstant, toCalendarDay } from "@softure-ai/core";
import type { ScheduledTaskRepeat } from "../../modules/projects/scheduled-tasks.ts";

const PERIOD_DAYS: Record<Exclude<ScheduledTaskRepeat, "none">, number> = { daily: 1, weekly: 7 };

export interface NextRunInput {
  /** The planned time of the run that was just claimed (or of the paused run being resumed). */
  readonly plannedAt: Date;
  readonly repeat: ScheduledTaskRepeat;
  readonly now: Date;
  readonly timeZone: string;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** The next planned time, or null for a task that runs once. */
export function getNextRunAt({ plannedAt, repeat, now, timeZone }: NextRunInput): Date | null {
  if (repeat === "none") {
    return null;
  }
  const period = PERIOD_DAYS[repeat];
  const clock = getWallClock(plannedAt, timeZone);
  const plannedDay = `${String(clock.year)}-${pad(clock.month)}-${pad(clock.day)}`;
  const after = Math.max(plannedAt.getTime(), now.getTime());
  // Start near `after` instead of stepping one period at a time through a long gap.
  const daysBehind = Math.max(0, calendarDaysBetween(plannedDay, toCalendarDay(new Date(after), timeZone)));
  let periods = Math.max(1, Math.floor(daysBehind / period));
  for (;;) {
    const day = addCalendarDays(plannedDay, periods * period);
    const [year, month, date] = day.split("-").map(Number) as [number, number, number];
    const candidate = getZonedInstant({ year, month, day: date, hour: clock.hour, minute: clock.minute }, timeZone);
    if (candidate.getTime() > after) {
      return candidate;
    }
    periods += 1;
  }
}
