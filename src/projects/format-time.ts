// Times shown to the owner: in the app's time zone, short and unambiguous.
export function createTimeFormatter(locale: string, timeZone: string): (date: Date) => string {
  const format = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone });
  return (date) => format.format(date);
}

/** A planned time with its weekday ("Mon, Nov 30, 8:00 AM" in English): the day matters when a task waits for a weekly reset. */
export function createWeekdayTimeFormatter(locale: string, timeZone: string): (date: Date) => string {
  const format = new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone });
  return (date) => format.format(date);
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** How far `date` is from `now` in the locale's words ("in 3 days", "in 5 minutes"), in whole minutes, hours or days. */
export function formatRelativeTime(locale: string, date: Date, now: Date): string {
  const format = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const distance = date.getTime() - now.getTime();
  const size = Math.abs(distance);
  if (size < HOUR_MS) {
    return format.format(Math.round(distance / MINUTE_MS), "minute");
  }
  if (size < DAY_MS) {
    return format.format(Math.round(distance / HOUR_MS), "hour");
  }
  return format.format(Math.round(distance / DAY_MS), "day");
}
