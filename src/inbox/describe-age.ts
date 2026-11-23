// An entry's age as the inbox shows it, shared by the inbox screen and the terminal (FR-3, FR-15).
import { fillMessage, type AppMessages } from "../../messages/index.ts";

export function describeAge(copy: AppMessages["inbox"], ageDays: number | null): string {
  if (ageDays === null) {
    return copy.noDate;
  }
  if (ageDays === 0) {
    return copy.ageToday;
  }
  return ageDays === 1 ? copy.ageOneDay : fillMessage(copy.ageDays, { days: ageDays });
}
