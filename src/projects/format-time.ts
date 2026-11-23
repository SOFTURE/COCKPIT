// Times shown to the owner: in the app's time zone, short and unambiguous.
export function createTimeFormatter(locale: string, timeZone: string): (date: Date) => string {
  const format = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone });
  return (date) => format.format(date);
}
