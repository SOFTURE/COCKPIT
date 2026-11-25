// Captures what the app's loggers (@softure-ai/observability) print: `info` and `debug` go to console.log, `warn` and
// `error` to console.error, one line per call (`<level> <logger>: <message> key=value ...`).
import { vi } from "vitest";

export interface CapturedLogs {
  /** Every line printed since the capture started. */
  lines(): string[];
  /** The lines of one logger and message, e.g. `forge: forge issue created`. */
  find(text: string): string[];
  restore(): void;
}

export function captureLogs(): CapturedLogs {
  const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
  const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
  const lines = () => [...log.mock.calls, ...error.mock.calls].map((call) => call.map(String).join(" "));
  return {
    lines,
    find: (text) => lines().filter((line) => line.includes(text)),
    restore: () => {
      log.mockRestore();
      error.mockRestore();
    },
  };
}
