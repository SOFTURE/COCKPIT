import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** The server code whose lines must reach the telemetry backend; the CLI prints for a person on purpose. */
const SERVER_ROOTS = ["app", "modules", "src", "scripts"];

function listSources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return listSources(path);
    }
    return /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".test.ts") ? [path] : [];
  });
}

describe("server logging", () => {
  it("goes through @softure-ai/observability loggers, never a bare console call", () => {
    const offenders = SERVER_ROOTS.flatMap(listSources).filter((path) => /\bconsole\.(log|info|warn|error|debug)\(/.test(readFileSync(path, "utf8")));
    expect(offenders).toEqual([]);
  });
});
