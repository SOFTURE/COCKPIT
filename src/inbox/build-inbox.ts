// The decision inbox (FR-4, FR-6): every owner-queue entry of every watched project, oldest first, with its answer
// state from COCKPIT's own answers and from owner-word issues; answers whose entry has left form the history.
import { z } from "zod";
import type { OwnerQueueEntry } from "../state/state-schema.ts";
import { getStoredEntries } from "../state/stored-entries.ts";
import { parseOwnerWordMarker, type OwnerWordAnswer } from "./owner-word-marker.ts";

export type AnswerState =
  | { readonly kind: "open" }
  /**
   * The project recorded a "later" answer the older way: the entry stays in its queue carrying `(later: #N)`. It is
   * shown apart and not counted as waiting; it can still be answered. The URL is null when the scan did not store #N.
   */
  | { readonly kind: "deferred"; readonly issueNumber: number; readonly issueUrl: string | null }
  | { readonly kind: "sending"; readonly answer: OwnerWordAnswer }
  | {
      readonly kind: "sent" | "done";
      readonly answer: OwnerWordAnswer;
      readonly issueNumber: number;
      readonly issueUrl: string;
      /** Who answered (FR-16); null for an issue created outside COCKPIT or an answer older than the record of it. */
      readonly answeredBy: string | null;
    };

/** An answer COCKPIT recorded (projects.answers), as the inbox needs it. */
export interface InboxAnswer {
  readonly repositoryKey: string;
  readonly fullName: string;
  readonly entryId: string;
  readonly entryText: string;
  /** The answered entry's kind as stored with the answer; absent where a caller does not know it. */
  readonly entryKind?: OwnerQueueEntry["kind"];
  readonly answer: OwnerWordAnswer;
  readonly note: string | null;
  readonly answeredByName: string | null;
  readonly answeredAt: Date;
  readonly status: "creating" | "sent";
  readonly issueNumber: number | null;
  readonly issueUrl: string | null;
}

/** An answer given to an earlier wording of an entry that the project has reworded since (FR-6). */
export interface PreviousAnswer {
  readonly answer: OwnerWordAnswer;
  readonly issueNumber: number;
  readonly issueUrl: string;
}

/** An answer whose entry the project no longer lists. */
export interface HistoryRow {
  readonly projectName: string;
  readonly entryText: string;
  /** Null when the answer's record does not carry it; reads as for a decision. */
  readonly entryKind: OwnerQueueEntry["kind"] | null;
  readonly answer: OwnerWordAnswer;
  readonly note: string | null;
  readonly answeredBy: string | null;
  readonly answeredAt: Date;
  readonly issueNumber: number;
  readonly issueUrl: string;
  readonly done: boolean;
}

export interface InboxRow {
  readonly projectKey: string;
  readonly projectName: string;
  readonly entry: OwnerQueueEntry;
  /** Whole days since `since` in the app's time zone; null when the entry has no date. */
  readonly ageDays: number | null;
  readonly answer: AnswerState;
  /** Set when the entry is open again because its text changed after an earlier answer. */
  readonly previousAnswer: PreviousAnswer | null;
}

export interface Inbox {
  readonly rows: readonly InboxRow[];
  readonly unansweredCount: number;
  /** Entries the owner put off (`deferred`), listed last in `rows`. */
  readonly deferredCount: number;
  /** Newest first. */
  readonly history: readonly HistoryRow[];
}

export interface InboxSource {
  readonly key: string;
  readonly fullName: string;
  /** The last good state as stored; read defensively. */
  readonly state: unknown;
  readonly issues: unknown;
}

const storedIssueSchema = z.object({ number: z.number(), state: z.enum(["open", "closed"]), body: z.string(), url: z.string() });

const DAY_MS = 86_400_000;

/**
 * The project's own record of a "later" answer kept in the entry text: `(later: #N)`, also with more words before the
 * closing parenthesis. Since SOFTURE/SKILLS 0.37.0 a "later" moves the item to the later roadmap instead, so the
 * entry leaves the queue; this reads projects that settled the older way (WORKFLOW §8.6).
 */
const DEFERRAL_PATTERN = /\(later: #(\d+)\b/;

function getDeferredIssueNumber(text: string): number | null {
  const match = DEFERRAL_PATTERN.exec(text);
  return match?.[1] === undefined ? null : Number(match[1]);
}

export function isDeferredRow(row: InboxRow): boolean {
  return row.answer.kind === "deferred";
}

/** `YYYY-MM-DD` of `date` in `timeZone`. */
export function toLocalDate(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function getAgeDays(since: string | null, today: string): number | null {
  if (since === null || !/^\d{4}-\d{2}-\d{2}/.test(since)) {
    return null;
  }
  const days = Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${since.slice(0, 10)}T00:00:00Z`)) / DAY_MS);
  return Number.isFinite(days) ? Math.max(0, days) : null;
}

type StoredIssue = z.infer<typeof storedIssueSchema>;

function getIssues(issues: unknown): StoredIssue[] {
  const parsed = z.array(z.unknown()).safeParse(issues);
  if (!parsed.success) {
    return [];
  }
  return parsed.data.flatMap((value) => {
    const issue = storedIssueSchema.safeParse(value);
    return issue.success ? [issue.data] : [];
  });
}

/** Answers from owner-word issues no recorded answer claims: those created outside COCKPIT count too (FR-6). */
function getMarkerAnswers(issues: readonly StoredIssue[], claimed: ReadonlySet<number>): Map<string, AnswerState> {
  const answers = new Map<string, AnswerState>();
  for (const issue of issues) {
    const marker = claimed.has(issue.number) ? null : parseOwnerWordMarker(issue.body);
    if (marker === null) {
      continue;
    }
    const state: AnswerState = {
      kind: issue.state === "closed" ? "done" : "sent",
      answer: marker.answer,
      issueNumber: issue.number,
      issueUrl: issue.url,
      answeredBy: null,
    };
    // The newest issue for an entry wins: the list comes newest first, so keep the first seen.
    if (!answers.has(marker.entry)) {
      answers.set(marker.entry, state);
    }
  }
  return answers;
}

function compareRows(left: InboxRow, right: InboxRow): number {
  const deferredOrder = Number(isDeferredRow(left)) - Number(isDeferredRow(right));
  if (deferredOrder !== 0) {
    return deferredOrder;
  }
  const leftSince = left.entry.since ?? "9999";
  const rightSince = right.entry.since ?? "9999";
  return (
    leftSince.localeCompare(rightSince) ||
    left.projectName.localeCompare(right.projectName) ||
    left.entry.id.localeCompare(right.entry.id)
  );
}

function toAnswerState(answer: InboxAnswer, closed: ReadonlySet<number>): AnswerState {
  if (answer.status === "creating" || answer.issueNumber === null || answer.issueUrl === null) {
    return { kind: "sending", answer: answer.answer };
  }
  return {
    kind: closed.has(answer.issueNumber) ? "done" : "sent",
    answer: answer.answer,
    issueNumber: answer.issueNumber,
    issueUrl: answer.issueUrl,
    answeredBy: answer.answeredByName,
  };
}

/** Whether `text` cites issue `#number` (not a longer number that starts with the same digits). */
function citesIssue(text: string, issueNumber: number): boolean {
  return new RegExp(`#${String(issueNumber)}(?!\\d)`).test(text);
}

/**
 * The answer an entry still carries after its project re-worded it while settling that answer: the new text cites the
 * answer's issue. That is the project's own bookkeeping, never a new question, so it must not open the entry again.
 */
function getSettlingAnswer(answers: readonly InboxAnswer[], entry: OwnerQueueEntry): InboxAnswer | undefined {
  // Answers come oldest first: the newest one the text cites wins.
  return answers.findLast(
    (answer) => answer.entryId === entry.id && answer.issueNumber !== null && citesIssue(entry.text, answer.issueNumber),
  );
}

function getPreviousAnswer(answers: readonly InboxAnswer[], entry: OwnerQueueEntry): PreviousAnswer | null {
  // Answers come oldest first: the last earlier wording that became an issue wins.
  const earlier = answers.filter((answer) => answer.entryId === entry.id && answer.entryText !== entry.text);
  for (const answer of earlier.reverse()) {
    if (answer.issueNumber !== null && answer.issueUrl !== null) {
      return { answer: answer.answer, issueNumber: answer.issueNumber, issueUrl: answer.issueUrl };
    }
  }
  return null;
}

export function buildInbox(sources: readonly InboxSource[], now: Date, timeZone: string, answers: readonly InboxAnswer[] = []): Inbox {
  const today = toLocalDate(now, timeZone);
  const rows: InboxRow[] = [];
  const history: HistoryRow[] = [];
  const watched = new Set(sources.map((source) => source.key));
  for (const source of sources) {
    const issues = getIssues(source.issues);
    const closed = new Set(issues.filter((issue) => issue.state === "closed").map((issue) => issue.number));
    const ownAnswers = answers.filter((answer) => answer.repositoryKey === source.key);
    const claimed = new Set(ownAnswers.flatMap((answer) => (answer.issueNumber === null ? [] : [answer.issueNumber])));
    const markerAnswers = getMarkerAnswers(issues, claimed);
    const entries = getStoredEntries(source.state);
    const issueUrls = new Map(issues.map((issue) => [issue.number, issue.url]));
    for (const entry of entries) {
      const deferredIssue = getDeferredIssueNumber(entry.text);
      if (deferredIssue !== null) {
        rows.push({
          projectKey: source.key,
          projectName: source.fullName,
          entry,
          ageDays: getAgeDays(entry.since, today),
          answer: { kind: "deferred", issueNumber: deferredIssue, issueUrl: issueUrls.get(deferredIssue) ?? null },
          previousAnswer: null,
        });
        continue;
      }
      const current =
        ownAnswers.find((answer) => answer.entryId === entry.id && answer.entryText === entry.text) ??
        getSettlingAnswer(ownAnswers, entry);
      rows.push({
        projectKey: source.key,
        projectName: source.fullName,
        entry,
        ageDays: getAgeDays(entry.since, today),
        answer: current === undefined ? (markerAnswers.get(entry.id) ?? { kind: "open" }) : toAnswerState(current, closed),
        previousAnswer: current === undefined ? getPreviousAnswer(ownAnswers, entry) : null,
      });
    }
    if (source.state !== null) {
      const listed = new Set(entries.map((entry) => entry.id));
      history.push(...ownAnswers.filter((answer) => !listed.has(answer.entryId)).flatMap((answer) => toHistoryRow(answer, closed)));
    }
  }
  // Answers of projects no longer watched stay in the history (FR-6).
  history.push(...answers.filter((answer) => !watched.has(answer.repositoryKey)).flatMap((answer) => toHistoryRow(answer, new Set())));
  rows.sort(compareRows);
  history.sort((left, right) => right.answeredAt.getTime() - left.answeredAt.getTime());
  return {
    rows,
    unansweredCount: rows.filter((row) => row.answer.kind === "open").length,
    deferredCount: rows.filter(isDeferredRow).length,
    history,
  };
}

function toHistoryRow(answer: InboxAnswer, closed: ReadonlySet<number>): HistoryRow[] {
  if (answer.issueNumber === null || answer.issueUrl === null) {
    return [];
  }
  return [
    {
      projectName: answer.fullName,
      entryText: answer.entryText,
      entryKind: answer.entryKind ?? null,
      answer: answer.answer,
      note: answer.note,
      answeredBy: answer.answeredByName,
      answeredAt: answer.answeredAt,
      issueNumber: answer.issueNumber,
      issueUrl: answer.issueUrl,
      done: closed.has(answer.issueNumber),
    },
  ];
}
