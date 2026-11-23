#!/usr/bin/env node
// `cockpit overview | inbox | project <owner/name> [--json]`: COCKPIT's views in a terminal (FR-15).
import { runCli } from "./run-cli.ts";

process.exitCode = await runCli(process.argv.slice(2), {
  env: process.env,
  fetch: globalThis.fetch,
  stdout: (text) => process.stdout.write(`${text}\n`),
  stderr: (text) => process.stderr.write(`${text}\n`),
});
