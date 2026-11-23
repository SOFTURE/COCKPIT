// The deployment history `softure-deploy release-report` keeps in a GitHub Release body (`@softure-ai/deploy`,
// "Release report"): a `## Deployments` table between `<!-- softure-deploy:deployments -->` markers, one row per
// deploy run, newest on top. Cells are written as plain characters, so a row splits on `|`; results are read by their
// icons. A row that does not match the format is skipped, never fatal.

const SECTION_OPEN = "<!-- softure-deploy:deployments -->";
const SECTION_CLOSE = "<!-- /softure-deploy:deployments -->";
const COLUMNS = 7;

export type ReportOutcome = "deployed" | "failed" | "cancelled" | "skipped" | "pending";
export type ReportVerify = "passed" | "failed" | "skipped" | "cancelled" | null;

export interface DeploymentRow {
  /** ISO time the run finished (UTC, minute precision). */
  readonly at: string;
  readonly outcome: ReportOutcome;
  /** The server step a failed deploy stopped at; null otherwise. */
  readonly failedStep: string | null;
  readonly environment: string | null;
  readonly verify: ReportVerify;
  readonly runUrl: string;
  /** The workflow run id from the run URL; null when the URL names none. */
  readonly runId: number | null;
}

function readSection(body: string): string | null {
  const start = body.indexOf(SECTION_OPEN);
  if (start === -1) {
    return null;
  }
  const end = body.indexOf(SECTION_CLOSE, start + SECTION_OPEN.length);
  return end === -1 ? null : body.slice(start + SECTION_OPEN.length, end);
}

function toOutcome(cell: string): ReportOutcome {
  if (cell.startsWith("✅")) {
    return "deployed";
  }
  if (cell.startsWith("❌")) {
    return "failed";
  }
  if (cell.startsWith("⛔")) {
    return "cancelled";
  }
  return cell.startsWith("⏭") ? "skipped" : "pending";
}

function toVerify(cell: string): ReportVerify {
  const outcome = toOutcome(cell);
  if (outcome === "deployed") {
    return "passed";
  }
  return outcome === "pending" ? null : outcome;
}

function parseRow(line: string): DeploymentRow | null {
  const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
  if (cells.length !== COLUMNS) {
    return null;
  }
  const [when = "", result = "", environment = "", , , verify = "", run = ""] = cells;
  const time = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})$/.exec(when);
  const url = /\]\((https:\/\/[^)\s]+)\)/.exec(run)?.[1];
  if (time === null || url === undefined) {
    return null;
  }
  const outcome = toOutcome(result);
  const runId = /\/actions\/runs\/(\d+)/.exec(url)?.[1];
  return {
    at: `${time[1] ?? ""}T${time[2] ?? ""}:00Z`,
    outcome,
    failedStep: outcome === "failed" ? (/failed at (\S+)/.exec(result)?.[1] ?? null) : null,
    environment: environment === "" || environment === "—" ? null : environment,
    verify: toVerify(verify),
    runUrl: url,
    runId: runId === undefined ? null : Number(runId),
  };
}

/** The deployment rows of a release body, newest first as written; none without a deployments section. */
export function parseDeploymentRows(body: string): DeploymentRow[] {
  const section = readSection(body);
  if (section === null) {
    return [];
  }
  const lines = section.split("\n").map((line) => line.trim());
  const separator = lines.findIndex((line) => /^\|\s*-{3}/.test(line));
  if (separator === -1) {
    return [];
  }
  return lines
    .slice(separator + 1)
    .filter((line) => line.startsWith("|"))
    .map(parseRow)
    .filter((row): row is DeploymentRow => row !== null);
}
