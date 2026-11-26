// What the read tools answer: the values the overview and inbox screens render, as plain JSON (FR-13).
import { parseRepositoryName } from "../forge/repository-name.ts";
import type { HistoryRow, Inbox, InboxRow } from "../inbox/build-inbox.ts";
import type { Overview, OverviewRow } from "../overview/build-overview.ts";
import { err, ok, type Result } from "@softure-ai/core";

export type ProjectLookupError = "mcp.project_invalid" | "mcp.project_unknown";

/** One overview row, with the read time as ISO text. */
export function toProjectAnswer(row: OverviewRow) {
  return {
    project: row.fullName,
    status: row.status,
    brokenReasons: row.brokenReasons,
    read: { status: row.readStatus, at: row.readAt?.toISOString() ?? null },
    numbers: row.numbers,
    release: row.release,
    ci: row.ci,
    qualityReview: row.qualityReview,
    doctor: row.doctor,
  };
}

/** One inbox entry as the inbox screen shows it. */
export function toEntryAnswer(row: InboxRow) {
  return {
    project: row.projectName,
    id: row.entry.id,
    kind: row.entry.kind,
    text: row.entry.text,
    item: row.entry.item,
    source: row.entry.source,
    since: row.entry.since,
    ageDays: row.ageDays,
    answer: row.answer,
    previousAnswer: row.previousAnswer,
  };
}

function toHistoryAnswer(row: HistoryRow) {
  return {
    project: row.projectName,
    text: row.entryText,
    answer: row.answer,
    note: row.note,
    answeredAt: row.answeredAt.toISOString(),
    issueNumber: row.issueNumber,
    issueUrl: row.issueUrl,
    done: row.done,
  };
}

/** The overview: projects grouped by status, broken first, idle last. */
export function toOverviewAnswer(overview: Overview) {
  return {
    projectCount: overview.groups.reduce((count, group) => count + group.rows.length, 0),
    groups: overview.groups.map((group) => ({ status: group.status, projects: group.rows.map(toProjectAnswer) })),
  };
}

/** The inbox: open entries oldest first, the unanswered count and the history, newest first. */
export function toInboxAnswer(inbox: Inbox) {
  return {
    unansweredCount: inbox.unansweredCount,
    entries: inbox.rows.map(toEntryAnswer),
    history: inbox.history.map(toHistoryAnswer),
  };
}

/** One project's detail: its overview row and its inbox entries. `project` is `owner/name`, any letter case. */
export function toProjectDetailAnswer(
  overview: Overview,
  inbox: Inbox,
  project: string,
): Result<{ readonly project: ReturnType<typeof toProjectAnswer>; readonly entries: ReturnType<typeof toEntryAnswer>[] }, ProjectLookupError> {
  const name = parseRepositoryName(project.trim());
  if (!name.ok) {
    return err("mcp.project_invalid");
  }
  const row = overview.groups.flatMap((group) => group.rows).find((candidate) => candidate.key === name.value.key);
  if (row === undefined) {
    return err("mcp.project_unknown");
  }
  return ok({
    project: toProjectAnswer(row),
    entries: inbox.rows.filter((entry) => entry.projectKey === row.key).map(toEntryAnswer),
  });
}
