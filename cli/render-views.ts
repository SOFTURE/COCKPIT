// The overview, the inbox and a project's detail as terminal tables, worded as the screens word them (FR-15).
import { en } from "../messages/en.ts";
import { fillMessage } from "../messages/index.ts";
import { describeAge } from "../src/inbox/describe-age.ts";
import { describeDoctor, describeRelease, describeRoadmap, describeRun } from "../src/overview/describe-overview-row.ts";
import type { EntryAnswer, InboxAnswer, OverviewAnswer, ProjectAnswer, ProjectDetailAnswer } from "./answer-schemas.ts";
import { renderTable, toCellText } from "./render-table.ts";

export type FormatTime = (date: Date) => string;

const overviewCopy = en.overview;
const inboxCopy = en.inbox;
const copy = en.cli;
const columns = copy.columns;

function describeRead(at: string | null, formatTime: FormatTime): string {
  return at === null ? overviewCopy.neverRead : fillMessage(overviewCopy.readAt, { time: formatTime(new Date(at)) });
}

/** The values of one overview row, in the order of `PROJECT_COLUMNS`. */
function toProjectCells(project: ProjectAnswer, formatTime: FormatTime): string[] {
  const { numbers } = project;
  const counts = numbers === null ? ["", "", ""] : [String(numbers.queued), String(numbers.openChanges), String(numbers.waiting)];
  return [
    project.project,
    numbers === null ? overviewCopy.noState : describeRoadmap(overviewCopy, numbers.activeRoadmap),
    ...counts,
    describeRelease(overviewCopy, project.release),
    describeDoctor(overviewCopy, project.doctor).text,
    describeRun(overviewCopy, overviewCopy.ci, project.ci, formatTime),
    describeRun(overviewCopy, overviewCopy.qualityReview, project.qualityReview, formatTime),
    describeRead(project.read.at, formatTime),
  ];
}

const PROJECT_COLUMNS = [
  columns.project,
  columns.roadmap,
  columns.queued,
  columns.changes,
  columns.waiting,
  columns.release,
  columns.doctor,
  columns.ci,
  columns.qualityReview,
  columns.read,
];

function describeBrokenReasons(projects: readonly ProjectAnswer[]): string[] {
  return projects.flatMap((project) => project.brokenReasons.map((reason) => `${toCellText(project.project)}: ${overviewCopy.brokenReasons[reason]}`));
}

export function renderOverview(overview: OverviewAnswer, formatTime: FormatTime): string {
  if (overview.groups.length === 0) {
    return copy.noProjects;
  }
  return overview.groups
    .map((group) => {
      const heading = fillMessage(copy.groupHeading, { status: overviewCopy.statuses[group.status], count: group.projects.length });
      const table = renderTable(
        PROJECT_COLUMNS,
        group.projects.map((project) => toProjectCells(project, formatTime)),
      );
      return [heading, table, ...describeBrokenReasons(group.projects)].join("\n");
    })
    .join("\n\n");
}

function describeAnswer(entry: EntryAnswer): string {
  const { answer } = entry;
  if (answer.kind === "open") {
    return copy.open;
  }
  if (answer.kind === "sending") {
    return copy.sending;
  }
  const issue = fillMessage(inboxCopy.answerIssue, { answer: inboxCopy.answers[answer.answer], number: answer.issueNumber });
  return `${answer.kind === "done" ? inboxCopy.done : inboxCopy.sent} · ${issue}`;
}

function toEntryCells(entry: EntryAnswer): string[] {
  return [entry.text, inboxCopy.kinds[entry.kind], entry.item ?? "", entry.source, describeAge(inboxCopy, entry.ageDays), describeAnswer(entry)];
}

const ENTRY_COLUMNS = [columns.entry, columns.kind, columns.item, columns.source, columns.age, columns.answer];

export function renderInbox(inbox: InboxAnswer, formatTime: FormatTime): string {
  const parts = [fillMessage(copy.unanswered, { count: inbox.unansweredCount })];
  parts.push(
    inbox.entries.length === 0
      ? copy.noEntries
      : renderTable(
          [columns.project, ...ENTRY_COLUMNS],
          inbox.entries.map((entry) => [entry.project, ...toEntryCells(entry)]),
        ),
  );
  if (inbox.history.length > 0) {
    parts.push(
      `${inboxCopy.historyTitle}\n${renderTable(
        [columns.project, columns.entry, columns.answer, columns.answeredAt, columns.issue],
        inbox.history.map((row) => [row.project, row.text, inboxCopy.answers[row.answer], formatTime(new Date(row.answeredAt)), `#${String(row.issueNumber)}`]),
      )}`,
    );
  }
  return parts.join("\n\n");
}

export function renderProject(detail: ProjectDetailAnswer, formatTime: FormatTime): string {
  const { project, entries } = detail;
  const values = toProjectCells(project, formatTime);
  const facts = renderTable(
    [columns.project, project.project],
    [[columns.status, overviewCopy.statuses[project.status]], ...PROJECT_COLUMNS.slice(1).map((column, index) => [column, values[index + 1] ?? ""])],
  );
  const parts = [[facts, ...describeBrokenReasons([project])].join("\n")];
  parts.push(entries.length === 0 ? copy.noEntries : renderTable(ENTRY_COLUMNS, entries.map(toEntryCells)));
  return parts.join("\n\n");
}
