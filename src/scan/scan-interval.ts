// How often the scan runs (FR-3): `SCAN_INTERVAL_MINUTES`, 30 by default, 15 to 60 allowed. A wrong value stops the
// app at start instead of scanning at an interval nobody chose.
export const DEFAULT_SCAN_INTERVAL_MINUTES = 30;
export const MIN_SCAN_INTERVAL_MINUTES = 15;
export const MAX_SCAN_INTERVAL_MINUTES = 60;

export function getScanIntervalMinutes(value: string | undefined): number {
  if (value === undefined || value.trim() === "") {
    return DEFAULT_SCAN_INTERVAL_MINUTES;
  }
  const minutes = Number(value);
  if (!Number.isInteger(minutes) || minutes < MIN_SCAN_INTERVAL_MINUTES || minutes > MAX_SCAN_INTERVAL_MINUTES) {
    throw new Error(
      `getScanIntervalMinutes: SCAN_INTERVAL_MINUTES must be a whole number from ${String(MIN_SCAN_INTERVAL_MINUTES)} to ${String(MAX_SCAN_INTERVAL_MINUTES)}`,
    );
  }
  return minutes;
}
