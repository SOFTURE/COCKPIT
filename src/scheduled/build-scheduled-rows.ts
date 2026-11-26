// What the Scheduled tasks page shows of each task (CT-37). A scheduled row: the title, "N projects · <first prompt
// line>", the planned time with how far away it is. A done row: the title, "N projects · planned <time>", one result of
// the run's sends and the sent time; it opens its broadcast when the broadcast exists (a run that failed before
// sending never made one).
import type { StoredSend } from "../../modules/projects/broadcasts.ts";
import type { StoredScheduledTask } from "../../modules/projects/scheduled-tasks.ts";

/** How far a run got: failed somewhere, still sending, every send made, or nothing sent at all. */
export type RunResult =
  | { readonly kind: "failed"; readonly failed: number; readonly total: number }
  | { readonly kind: "sending" }
  | { readonly kind: "sent"; readonly sent: number; readonly total: number }
  | { readonly kind: "not_sent"; readonly failure: string | null };

export interface ScheduledRow {
  readonly id: string;
  readonly title: string;
  readonly projectCount: number;
  /** The prompt's first non-empty line, trimmed. */
  readonly promptLine: string;
  /** The whole prompt and the chosen projects, for the Edit dialog (CT-38). */
  readonly prompt: string;
  readonly repositoryKeys: readonly string[];
  readonly runAt: Date;
  /** Being sent right now: neither Run now nor Delete applies. */
  readonly isSending: boolean;
}

export interface DoneRow {
  readonly id: string;
  readonly title: string;
  readonly projectCount: number;
  readonly runAt: Date;
  readonly sentAt: Date;
  readonly result: RunResult;
  /** The broadcast's detail page, or null when the run made no broadcast. */
  readonly href: string | null;
}

/** The first line of a prompt that says something. */
export function getPromptLine(prompt: string): string {
  return prompt.split("\n").map((line) => line.trim()).find((line) => line.length > 0) ?? "";
}

export function buildScheduledRow(task: StoredScheduledTask): ScheduledRow {
  return {
    id: task.id,
    title: task.title,
    projectCount: task.repositoryKeys.length,
    promptLine: getPromptLine(task.prompt),
    prompt: task.prompt,
    repositoryKeys: task.repositoryKeys,
    runAt: task.runAt,
    isSending: task.status === "sending",
  };
}

/** The result of one run from its broadcast's sends; a failed task with no sends sent nothing. */
export function getRunResult(task: StoredScheduledTask, sends: readonly StoredSend[]): RunResult {
  if (sends.length === 0) {
    return task.status === "failed" ? { kind: "not_sent", failure: task.failure } : { kind: "sending" };
  }
  const failed = sends.filter((send) => send.status === "failed").length;
  if (failed > 0) {
    return { kind: "failed", failed, total: sends.length };
  }
  if (sends.some((send) => send.status !== "sent")) {
    return { kind: "sending" };
  }
  return { kind: "sent", sent: sends.length, total: sends.length };
}

/** A fired task's row; `sendsByBroadcast` holds every broadcast's sends by broadcast id. */
export function buildDoneRow(task: StoredScheduledTask, sendsByBroadcast: ReadonlyMap<string, readonly StoredSend[]>): DoneRow {
  const sends = task.broadcastId === null ? [] : (sendsByBroadcast.get(task.broadcastId) ?? []);
  return {
    id: task.id,
    title: task.title,
    projectCount: task.repositoryKeys.length,
    runAt: task.runAt,
    sentAt: task.sentAt ?? task.claimedAt ?? task.runAt,
    result: getRunResult(task, sends),
    href: task.broadcastId !== null && sends.length > 0 ? `/broadcast/${task.broadcastId}` : null,
  };
}

/** Every send grouped by its broadcast. */
export function groupSendsByBroadcast(sends: readonly StoredSend[]): Map<string, StoredSend[]> {
  const groups = new Map<string, StoredSend[]>();
  for (const send of sends) {
    const group = groups.get(send.broadcastId);
    if (group === undefined) {
      groups.set(send.broadcastId, [send]);
    } else {
      group.push(send);
    }
  }
  return groups;
}
