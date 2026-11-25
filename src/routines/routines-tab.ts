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

export interface FiredIssue {
  readonly number: number;
  readonly title: string;
  readonly url: string;
  readonly wake: IssueWake;
}

export interface RoutinesTab {
  readonly routines: readonly RoutineView[];
  /** The issues of the recent fires, newest first, each with all its fires. */
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

export function buildRoutinesTab(routines: readonly StoredRoutine[], fires: readonly StoredFire[], canStore: boolean): RoutinesTab {
  const issues: FiredIssue[] = [];
  for (const fire of [...fires].sort((a, b) => b.id - a.id)) {
    if (issues.some((issue) => issue.number === fire.issueNumber)) {
      continue;
    }
    const wake = getIssueWake(fires, fire.repositoryKey, fire.issueNumber);
    if (wake !== null) {
      issues.push({ number: fire.issueNumber, title: fire.issueTitle, url: fire.issueUrl, wake });
    }
  }
  return { routines: routines.map(toRoutineView), issues, canStore };
}
