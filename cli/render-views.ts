// The overview, the inbox and a project's detail as terminal tables, worded as the screens word them (FR-15).
import { fillMessage, type AppMessages } from "../messages/index.ts";
import { describeAge } from "../src/inbox/describe-age.ts";
import { describeDoctor, describeRelease, describeRoadmap, describeRunWithSource } from "../src/overview/describe-overview-row.ts";
import type { EntryAnswer, InboxAnswer, OverviewAnswer, ProjectAnswer, ProjectDetailAnswer } from "./answer-schemas.ts";
import { renderTable, toCellText } from "./render-table.ts";

export type FormatTime = (date: Date) => string;

/** What every view needs: the copy in the CLI's language and the time format. */
export interface RenderContext {
  readonly messages: AppMessages;
  readonly formatTime: FormatTime;
}

function describeRead(at: string | null, context: RenderContext): string {
  const copy = context.messages.overview;
  return at === null ? copy.neverRead : fillMessage(copy.readAt, { time: context.formatTime(new Date(at)) });
}

/** The values of one overview row, in the order of `getProjectColumns`. */
function toProjectCells(project: ProjectAnswer, context: RenderContext): string[] {
  const overviewCopy = context.messages.overview;
  const { numbers } = project;
  const counts = numbers === null ? ["", "", ""] : [String(numbers.queued), String(numbers.openChanges), String(numbers.waiting)];
  return [
    project.project,
    numbers === null ? overviewCopy.noState : describeRoadmap(overviewCopy, numbers.activeRoadmap),
    ...counts,
    describeRelease(overviewCopy, project.release),
    describeDoctor(overviewCopy, project.doctor).text,
    describeRunWithSource(overviewCopy, overviewCopy.ci, project.ci, context.formatTime),
    describeRunWithSource(overviewCopy, overviewCopy.qualityReview, project.qualityReview, context.formatTime),
    describeRead(project.read.at, context),
  ];
}

function getProjectColumns(messages: AppMessages): string[] {
  const columns = messages.cli.columns;
  return [
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
}

function describeBrokenReasons(projects: readonly ProjectAnswer[], messages: AppMessages): string[] {
  return projects.flatMap((project) => project.brokenReasons.map((reason) => `${toCellText(project.project)}: ${messages.overview.brokenReasons[reason]}`));
}

export function renderOverview(overview: OverviewAnswer, context: RenderContext): string {
  const { messages } = context;
  if (overview.groups.length === 0) {
    return messages.cli.noProjects;
  }
  return overview.groups
    .map((group) => {
      const heading = fillMessage(messages.cli.groupHeading, { status: messages.overview.statuses[group.status], count: group.projects.length });
      const table = renderTable(
        getProjectColumns(messages),
        group.projects.map((project) => toProjectCells(project, context)),
      );
      return [heading, table, ...describeBrokenReasons(group.projects, messages)].join("\n");
    })
    .join("\n\n");
}

function describeAnswer(entry: EntryAnswer, messages: AppMessages): string {
  const { answer } = entry;
  const inboxCopy = messages.inbox;
  if (answer.kind === "open") {
    return messages.cli.open;
  }
  if (answer.kind === "sending") {
    return messages.cli.sending;
  }
  const issue = fillMessage(inboxCopy.answerIssue, { answer: inboxCopy.answers[answer.answer], number: answer.issueNumber });
  return `${answer.kind === "done" ? inboxCopy.done : inboxCopy.sent} · ${issue}`;
}

function toEntryCells(entry: EntryAnswer, messages: AppMessages): string[] {
  const inboxCopy = messages.inbox;
  return [entry.text, inboxCopy.kinds[entry.kind], entry.item ?? "", entry.source, describeAge(inboxCopy, entry.ageDays), describeAnswer(entry, messages)];
}

function getEntryColumns(messages: AppMessages): string[] {
  const columns = messages.cli.columns;
  return [columns.entry, columns.kind, columns.item, columns.source, columns.age, columns.answer];
}

export function renderInbox(inbox: InboxAnswer, context: RenderContext): string {
  const { messages, formatTime } = context;
  const { columns } = messages.cli;
  const parts = [fillMessage(messages.cli.unanswered, { count: inbox.unansweredCount })];
  parts.push(
    inbox.entries.length === 0
      ? messages.cli.noEntries
      : renderTable(
          [columns.project, ...getEntryColumns(messages)],
          inbox.entries.map((entry) => [entry.project, ...toEntryCells(entry, messages)]),
        ),
  );
  if (inbox.history.length > 0) {
    parts.push(
      `${messages.inbox.historyTitle}\n${renderTable(
        [columns.project, columns.entry, columns.answer, columns.answeredAt, columns.issue],
        inbox.history.map((row) => [row.project, row.text, messages.inbox.answers[row.answer], formatTime(new Date(row.answeredAt)), `#${String(row.issueNumber)}`]),
      )}`,
    );
  }
  return parts.join("\n\n");
}

export function renderProject(detail: ProjectDetailAnswer, context: RenderContext): string {
  const { messages } = context;
  const { columns } = messages.cli;
  const { project, entries } = detail;
  const values = toProjectCells(project, context);
  const facts = renderTable(
    [columns.project, project.project],
    [[columns.status, messages.overview.statuses[project.status]], ...getProjectColumns(messages).slice(1).map((column, index) => [column, values[index + 1] ?? ""])],
  );
  const parts = [[facts, ...describeBrokenReasons([project], messages)].join("\n")];
  parts.push(entries.length === 0 ? messages.cli.noEntries : renderTable(getEntryColumns(messages), entries.map((entry) => toEntryCells(entry, messages))));
  return parts.join("\n\n");
}
