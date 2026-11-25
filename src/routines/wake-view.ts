// What the screens show of waking (CT-10), from COCKPIT's own data only: a project's wake-up state (the overview's
// chip) and the fires of one issue (the broadcast page, the inbox, the project's Routines tab). Nothing here carries a
// token: a routine shows by its name, and a token only by its last four characters on the Routines tab.
import { COCKPIT_ISSUES_KIND, type StoredFire, type StoredRoutine } from "../../modules/projects/routines.ts";

/**
 * `on_its_own`: an enabled `cockpit-issues` routine whose last call succeeded; `failing`: enabled ones whose last
 * calls failed; `untested`: enabled ones never called; `none`: no enabled `cockpit-issues` routine.
 */
export type ProjectWake = "on_its_own" | "failing" | "untested" | "none";

export function getProjectWake(routines: readonly StoredRoutine[], key: string): ProjectWake {
  const wakeRoutines = routines.filter((routine) => routine.repositoryKey === key && routine.enabled && routine.kind === COCKPIT_ISSUES_KIND);
  if (wakeRoutines.length === 0) {
    return "none";
  }
  if (wakeRoutines.some((routine) => routine.lastFireOk === true)) {
    return "on_its_own";
  }
  return wakeRoutines.some((routine) => routine.lastFireOk === false) ? "failing" : "untested";
}

export interface FireView {
  /** Null on the `no_routine` line. */
  readonly routineName: string | null;
  readonly status: StoredFire["status"];
  readonly httpStatus: number | null;
  readonly reason: string | null;
  readonly at: Date;
  readonly nextAttemptAt: Date | null;
}

export interface IssueWake {
  readonly repositoryKey: string;
  readonly issueNumber: number;
  readonly fires: readonly FireView[];
  /** True when a Retry has something to do: a failed, queued or no-routine fire. */
  readonly canRetry: boolean;
}

/** The fires of one issue, or null when it has none recorded (an issue from before CT-10, or created elsewhere). */
export function getIssueWake(fires: readonly StoredFire[], repositoryKey: string, issueNumber: number): IssueWake | null {
  const own = fires.filter((fire) => fire.repositoryKey === repositoryKey && fire.issueNumber === issueNumber);
  if (own.length === 0) {
    return null;
  }
  return {
    repositoryKey,
    issueNumber,
    fires: own.map((fire) => ({
      routineName: fire.routineName,
      status: fire.status,
      httpStatus: fire.httpStatus,
      reason: fire.reason,
      at: fire.updatedAt,
      nextAttemptAt: fire.nextAttemptAt,
    })),
    canRetry: own.some((fire) => fire.status === "failed" || fire.status === "queued" || fire.status === "no_routine"),
  };
}
