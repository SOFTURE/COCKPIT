// The decision inbox (FR-4): every owner-queue entry of every watched project, oldest first, with its answer state.
import { z } from "zod";
import { ownerQueueEntrySchema, type OwnerQueueEntry } from "../state/state-schema.ts";
import { parseOwnerWordMarker, type OwnerWordAnswer } from "./owner-word-marker.ts";

export type AnswerState =
  | { readonly kind: "open" }
  | { readonly kind: "sent" | "done"; readonly answer: OwnerWordAnswer; readonly issueNumber: number; readonly issueUrl: string };

export interface InboxRow {
  readonly projectKey: string;
  readonly projectName: string;
  readonly entry: OwnerQueueEntry;
  /** Whole days since `since` in the app's time zone; null when the entry has no date. */
  readonly ageDays: number | null;
  readonly answer: AnswerState;
}

export interface Inbox {
  readonly rows: readonly InboxRow[];
  readonly unansweredCount: number;
}

export interface InboxSource {
  readonly key: string;
  readonly fullName: string;
  /** The last good state as stored; read defensively. */
  readonly state: unknown;
  readonly issues: unknown;
}

const storedStateSchema = z.object({ owner_queue: z.array(z.unknown()) });
const storedIssueSchema = z.object({ number: z.number(), state: z.enum(["open", "closed"]), body: z.string(), url: z.string() });

const DAY_MS = 86_400_000;

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

function getEntries(state: unknown): OwnerQueueEntry[] {
  const parsed = storedStateSchema.safeParse(state);
  if (!parsed.success) {
    return [];
  }
  return parsed.data.owner_queue.flatMap((value) => {
    const entry = ownerQueueEntrySchema.safeParse(value);
    return entry.success ? [entry.data] : [];
  });
}

function getAnswers(issues: unknown): Map<string, AnswerState> {
  const answers = new Map<string, AnswerState>();
  const parsed = z.array(z.unknown()).safeParse(issues);
  if (!parsed.success) {
    return answers;
  }
  for (const value of parsed.data) {
    const issue = storedIssueSchema.safeParse(value);
    const marker = issue.success ? parseOwnerWordMarker(issue.data.body) : null;
    if (!issue.success || marker === null) {
      continue;
    }
    const state: AnswerState = {
      kind: issue.data.state === "closed" ? "done" : "sent",
      answer: marker.answer,
      issueNumber: issue.data.number,
      issueUrl: issue.data.url,
    };
    // The newest issue for an entry wins: the list comes newest first, so keep the first seen.
    if (!answers.has(marker.entry)) {
      answers.set(marker.entry, state);
    }
  }
  return answers;
}

function compareRows(left: InboxRow, right: InboxRow): number {
  const leftSince = left.entry.since ?? "9999";
  const rightSince = right.entry.since ?? "9999";
  return (
    leftSince.localeCompare(rightSince) ||
    left.projectName.localeCompare(right.projectName) ||
    left.entry.id.localeCompare(right.entry.id)
  );
}

export function buildInbox(sources: readonly InboxSource[], now: Date, timeZone: string): Inbox {
  const today = toLocalDate(now, timeZone);
  const rows: InboxRow[] = [];
  for (const source of sources) {
    const answers = getAnswers(source.issues);
    for (const entry of getEntries(source.state)) {
      rows.push({
        projectKey: source.key,
        projectName: source.fullName,
        entry,
        ageDays: getAgeDays(entry.since, today),
        answer: answers.get(entry.id) ?? { kind: "open" },
      });
    }
  }
  rows.sort(compareRows);
  return { rows, unansweredCount: rows.filter((row) => row.answer.kind === "open").length };
}
