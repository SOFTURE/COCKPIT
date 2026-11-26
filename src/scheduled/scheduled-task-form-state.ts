// The scheduled task dialog's rules (CT-38), pure so the dialog only calls them: the time a new task starts with
// (tomorrow 08:00), the two quick times ("Tomorrow 08:00", "Monday 08:00"), the local date and time of a stored task,
// the muted hint under the time ("Europe/Warsaw · in 3 days"), the length counters and which field an error names.
// Every date and time is a wall clock in the app's time zone.
import { addCalendarDays, getWallClock, getZonedInstant, isCalendarDay, type WallClock } from "@softure-ai/core";
import { formatRelativeTime } from "../projects/format-time.ts";
import type { ScheduledTaskErrorCode } from "./scheduled-task-errors.ts";

/** The dialog's fields an error can name; `when` is the date and the time together. */
export type ScheduledTaskField = "title" | "prompt" | "when" | "projects";

/** A wall-clock time as the date and time inputs hold it: `YYYY-MM-DD` and `HH:mm`. */
export interface RunAtFields {
  readonly date: string;
  readonly time: string;
}

export interface QuickTimes {
  readonly tomorrow: RunAtFields;
  readonly monday: RunAtFields;
}

/** The hour the quick times and a new task start at. */
export const DEFAULT_HOUR = 8;

/** The title's counter shows once this share of its limit is used; the prompt's always shows. */
export const TITLE_COUNTER_FROM = 0.8;

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DAYS_IN_WEEK = 7;
const MONDAY = 1;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toDay(clock: Pick<WallClock, "year" | "month" | "day">): string {
  return `${String(clock.year)}-${pad(clock.month)}-${pad(clock.day)}`;
}

function atDefaultHour(day: string): RunAtFields {
  return { date: day, time: `${pad(DEFAULT_HOUR)}:00` };
}

/** The day of the week of a `YYYY-MM-DD` day: 0 is Sunday. */
function getWeekday(day: string): number {
  return new Date(`${day}T00:00:00Z`).getUTCDay();
}

/** "Tomorrow 08:00" and "Monday 08:00" (the next Monday after today, a week ahead on a Monday), in the app's zone. */
export function getQuickTimes(now: Date, timeZone: string): QuickTimes {
  const today = toDay(getWallClock(now, timeZone));
  const daysToMonday = (MONDAY - getWeekday(today) + DAYS_IN_WEEK) % DAYS_IN_WEEK || DAYS_IN_WEEK;
  return { tomorrow: atDefaultHour(addCalendarDays(today, 1)), monday: atDefaultHour(addCalendarDays(today, daysToMonday)) };
}

/** A new task's time: tomorrow 08:00. */
export function getDefaultRunAt(now: Date, timeZone: string): RunAtFields {
  return getQuickTimes(now, timeZone).tomorrow;
}

/** A stored task's time as the inputs show it. */
export function splitRunAt(instant: Date, timeZone: string): RunAtFields {
  const clock = getWallClock(instant, timeZone);
  return { date: toDay(clock), time: `${pad(clock.hour)}:${pad(clock.minute)}` };
}

/** What the form posts as `runAt`: `YYYY-MM-DDTHH:mm`. */
export function joinRunAt(fields: RunAtFields): string {
  return `${fields.date}T${fields.time}`;
}

/** The instant the fields name, or null while the date or the time is incomplete. */
export function getRunAtInstant(fields: RunAtFields, timeZone: string): Date | null {
  const time = TIME_PATTERN.exec(fields.time);
  // `isCalendarDay` refuses a day the month lacks (31 April).
  if (!isCalendarDay(fields.date) || time === null) {
    return null;
  }
  const [year, month, day] = fields.date.split("-").map(Number) as [number, number, number];
  return getZonedInstant({ year, month, day, hour: Number(time[1]), minute: Number(time[2]) }, timeZone);
}

export interface RunHintInput {
  readonly fields: RunAtFields;
  readonly now: Date;
  readonly timeZone: string;
  readonly locale: string;
}

/** "Europe/Warsaw · in 3 days"; the zone alone while the date or the time is incomplete. */
export function getRunHint({ fields, now, timeZone, locale }: RunHintInput): string {
  const instant = getRunAtInstant(fields, timeZone);
  return instant === null ? timeZone : `${timeZone} · ${formatRelativeTime(locale, instant, now)}`;
}

/** "120 / 200", or null while the counter stays hidden. */
export function getCounter(length: number, max: number, showFrom = 0): string | null {
  return length >= max * showFrom ? `${String(length)} / ${String(max)}` : null;
}

const ERROR_FIELDS: Partial<Record<ScheduledTaskErrorCode, ScheduledTaskField>> = {
  "scheduled.title_missing": "title",
  "scheduled.title_too_long": "title",
  "scheduled.prompt_missing": "prompt",
  "scheduled.prompt_too_long": "prompt",
  "scheduled.time_invalid": "when",
  "scheduled.time_past": "when",
  "scheduled.no_projects": "projects",
  "scheduled.project_not_watched": "projects",
};

/** The field an error names, or null when it is about the whole task (it no longer exists, saving failed). */
export function getErrorField(code: ScheduledTaskErrorCode): ScheduledTaskField | null {
  return ERROR_FIELDS[code] ?? null;
}
