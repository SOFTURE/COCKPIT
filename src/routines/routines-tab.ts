// What a project's Routines tab shows (CT-10). A routine leaves the server without its sealed token: only the last
// four characters of the token go to the browser.
import type { StoredFire, StoredRoutine } from "../../modules/projects/routines.ts";
import { getIssueWake, type IssueWake } from "./wake-view.ts";

export interface RoutineView {
  readonly id: number;
  readonly name: string;
  readonly kind: string;
  readonly triggerId: string;
  readonly tokenLast4: string;
  readonly enabled: boolean;
  readonly lastCall: { readonly ok: boolean; readonly status: number | null; readonly at: Date } | null;
}

/**
 * One issue's fires as one state: `failed` when any fire failed, `pending` when any is queued or still firing,
 * `no_routine` when the project had no routine to fire, `fired` when every routine was fired.
 */
export type FiredIssueState = "fired" | "failed" | "pending" | "no_routine";

export interface FiredIssue {
  readonly number: number;
  readonly title: string;
  readonly url: string;
  /** When the issue's newest fire was recorded; a Retry does not move it. */
  readonly firedAt: Date;
  readonly state: FiredIssueState;
  readonly wake: IssueWake;
}

/** How far back the Recent fires card reaches (CT-15). */
export const RECENT_FIRES_DAYS = 14;

const DAY_MS = 86_400_000;

/** The oldest fire time the Recent fires card shows, counted back from `now`. */
export function getRecentFiresSince(now: Date): Date {
  return new Date(now.getTime() - RECENT_FIRES_DAYS * DAY_MS);
}

export function getFiredIssueState(wake: IssueWake): FiredIssueState {
  const statuses = wake.fires.map((fire) => fire.status);
  if (statuses.includes("failed")) {
    return "failed";
  }
  if (statuses.includes("queued") || statuses.includes("sending")) {
    return "pending";
  }
  return statuses.every((status) => status === "no_routine") ? "no_routine" : "fired";
}

export interface RoutinesTab {
  readonly routines: readonly RoutineView[];
  /** The issues fired in the last 14 days, newest first, each with all its fires of that window. */
  readonly issues: readonly FiredIssue[];
  /** False without ROUTINE_TOKEN_SECRET: nothing can be stored or fired. */
  readonly canStore: boolean;
}

export function toRoutineView(routine: StoredRoutine): RoutineView {
  return {
    id: routine.id,
    name: routine.name,
    kind: routine.kind,
    triggerId: routine.triggerId,
    tokenLast4: routine.tokenLast4,
    enabled: routine.enabled,
    lastCall: routine.lastFireOk === null || routine.lastFireAt === null ? null : { ok: routine.lastFireOk, status: routine.lastFireStatus, at: routine.lastFireAt },
  };
}

export interface RoutinesTabInput {
  readonly routines: readonly StoredRoutine[];
  readonly fires: readonly StoredFire[];
  /** False without ROUTINE_TOKEN_SECRET. */
  readonly canStore: boolean;
  /** The time the 14-day window is counted back from. */
  readonly now: Date;
}

export function buildRoutinesTab({ routines, fires, canStore, now }: RoutinesTabInput): RoutinesTab {
  const since = getRecentFiresSince(now).getTime();
  const recent = fires.filter((fire) => fire.createdAt.getTime() >= since);
  const issues: FiredIssue[] = [];
  for (const fire of [...recent].sort((a, b) => b.id - a.id)) {
    if (issues.some((issue) => issue.number === fire.issueNumber)) {
      continue;
    }
    const wake = getIssueWake(recent, fire.repositoryKey, fire.issueNumber);
    if (wake === null) {
      continue;
    }
    const firedAt = recent
      .filter((own) => own.issueNumber === fire.issueNumber)
      .reduce((newest, own) => (own.createdAt > newest ? own.createdAt : newest), fire.createdAt);
    issues.push({ number: fire.issueNumber, title: fire.issueTitle, url: fire.issueUrl, firedAt, state: getFiredIssueState(wake), wake });
  }
  return { routines: routines.map(toRoutineView), issues, canStore };
}
