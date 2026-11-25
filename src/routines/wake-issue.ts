// Waking a project (CT-10): right after COCKPIT opened a cockpit issue there, it fires every enabled `cockpit-issues`
// routine of that project with a text that names the issue. Each fire is recorded on the issue (sent, failed with the
// HTTP status and a reason word, queued under a limit or a 429, or no routine at all). The issue is never touched:
// a failed fire is shown with a Retry, and a queued one is fired by the drain schedule once its time comes.
// Nothing here logs or stores the token: log lines name the routine id and the trigger id only.
import { err, ok, type Clock, type Result } from "@softure-ai/core";
import type { Queryable } from "@softure-ai/db";
import { createLogger } from "@softure-ai/observability";
import {
  claimFire,
  clearNoRoutine,
  COCKPIT_ISSUES_KIND,
  findDueFires,
  findFires,
  findRoutines,
  findRoutinesById,
  markFire,
  recordRoutineCall,
  reserveCall,
  takeOverFire,
  type FireIssue,
  type FireLimits,
  type StoredFire,
  type StoredRoutine,
} from "../../modules/projects/routines.ts";
import { formatIssueFireText, type FireResult, type RoutinesApi } from "./routines-api.ts";
import type { TokenBox } from "./token-box.ts";

/** 30 calls an hour per routine, 100 in all (the owner's limits). */
export const FIRE_LIMITS: FireLimits = { perRoutine: 30, total: 100, windowMs: 60 * 60_000 };
/** A 429 is tried again this many times in all before it stays failed. */
export const MAX_RATE_LIMITED_ATTEMPTS = 5;
/** A 429 without `retry-after` waits this long. */
export const DEFAULT_RETRY_AFTER_SECONDS = 60;
/** A fire still `sending` after this long belongs to a request that died. */
export const STALE_FIRE_MS = 2 * 60_000;

export type WakeErrorCode = "wake.storage_failed";

/** What waking needs; null where routines cannot be fired (no ROUTINE_TOKEN_SECRET). */
export interface WakeDependencies {
  readonly db: Queryable;
  readonly clock: Clock;
  readonly api: RoutinesApi;
  /** Null without ROUTINE_TOKEN_SECRET: every fire fails as `secret_missing`. */
  readonly box: TokenBox | null;
  readonly limits?: FireLimits;
}

export interface WakeSummary {
  readonly sent: number;
  readonly failed: number;
  readonly queued: number;
  readonly noRoutine: boolean;
}

const logger = createLogger("routines");

function isWakeRoutine(routine: StoredRoutine): boolean {
  return routine.enabled && routine.kind === COCKPIT_ISSUES_KIND;
}

function toIssue(fire: StoredFire): FireIssue {
  return { repositoryKey: fire.repositoryKey, fullName: fire.fullName, number: fire.issueNumber, url: fire.issueUrl, title: fire.issueTitle };
}

function summarize(fires: readonly StoredFire[]): WakeSummary {
  return {
    sent: fires.filter((fire) => fire.status === "sent").length,
    failed: fires.filter((fire) => fire.status === "failed").length,
    queued: fires.filter((fire) => fire.status === "queued" || fire.status === "sending").length,
    noRoutine: fires.some((fire) => fire.status === "no_routine"),
  };
}

/** Fires one claimed (`sending`) row and records the outcome; the routine's last call is kept for the overview. */
async function fireClaimed(deps: WakeDependencies, fire: StoredFire, routine: StoredRoutine | undefined): Promise<Result<undefined, WakeErrorCode>> {
  const { db, clock } = deps;
  const fields = { repository: fire.fullName, issue: fire.issueNumber, routine_id: fire.routineId ?? undefined };
  const record = async (outcome: Parameters<typeof markFire>[2]): Promise<Result<undefined, WakeErrorCode>> => {
    const marked = await markFire(db, fire.id, outcome);
    return marked.ok ? ok(undefined) : err("wake.storage_failed");
  };
  if (routine === undefined || !isWakeRoutine(routine)) {
    // The routine was deleted, disabled or changed kind since the fire was claimed.
    logger.info("routine fire skipped", { ...fields, reason: "routine_gone" });
    return record({ status: "failed", httpStatus: null, reason: "routine_gone", nextAttemptAt: null, at: clock.now() });
  }
  const token = deps.box?.open(routine.tokenCiphertext) ?? null;
  if (token === null) {
    logger.warn("routine fire failed", { ...fields, trigger: routine.triggerId, reason: deps.box === null ? "secret_missing" : "token_unreadable" });
    return record({ status: "failed", httpStatus: null, reason: deps.box === null ? "secret_missing" : "token_unreadable", nextAttemptAt: null, at: clock.now() });
  }
  const reservation = await reserveCall(db, routine.id, clock.now(), deps.limits ?? FIRE_LIMITS);
  if (!reservation.ok) {
    return err("wake.storage_failed");
  }
  if (reservation.value.kind === "limited") {
    logger.info("routine fire queued", { ...fields, trigger: routine.triggerId, reason: "limit", until: reservation.value.freeAt.toISOString() });
    return record({ status: "queued", httpStatus: null, reason: "limit", nextAttemptAt: reservation.value.freeAt, at: clock.now() });
  }
  const result: FireResult = await deps.api.fire({ triggerId: routine.triggerId, token, text: formatIssueFireText(toIssue(fire)) });
  const at = clock.now();
  const called = await recordRoutineCall(db, routine.id, { ok: result.ok, status: result.status, at });
  if (!called.ok) {
    return err("wake.storage_failed");
  }
  if (result.ok) {
    logger.info("routine fired", { ...fields, trigger: routine.triggerId, status: result.status });
    return record({ status: "sent", httpStatus: result.status, reason: null, nextAttemptAt: null, at });
  }
  const isRetried = result.reason === "rate_limited" && fire.attempts + 1 < MAX_RATE_LIMITED_ATTEMPTS;
  logger.warn(isRetried ? "routine fire rate limited" : "routine fire failed", { ...fields, trigger: routine.triggerId, status: result.status ?? undefined, reason: result.reason });
  return record({
    status: isRetried ? "queued" : "failed",
    httpStatus: result.status,
    reason: result.reason,
    nextAttemptAt: isRetried ? new Date(at.getTime() + (result.retryAfterSeconds ?? DEFAULT_RETRY_AFTER_SECONDS) * 1000) : null,
    at,
  });
}

/** Fires the routines of a fresh issue, or takes over its failed, queued or stale fires when `retry` is set. */
async function wake(deps: WakeDependencies, issue: FireIssue, retry: boolean): Promise<Result<WakeSummary, WakeErrorCode>> {
  const { db, clock } = deps;
  const listed = await findRoutines(db, issue.repositoryKey);
  if (!listed.ok) {
    return err("wake.storage_failed");
  }
  const wakeRoutines = listed.value.filter(isWakeRoutine);
  if (retry && wakeRoutines.length > 0) {
    const cleared = await clearNoRoutine(db, issue.repositoryKey, issue.number);
    if (!cleared.ok) {
      return err("wake.storage_failed");
    }
  }
  if (wakeRoutines.length === 0) {
    const claimed = await claimFire(db, issue, null, clock.now());
    if (!claimed.ok) {
      return err("wake.storage_failed");
    }
    logger.info("no routine to fire", { repository: issue.fullName, issue: issue.number });
  }
  for (const routine of wakeRoutines) {
    const claimed = await claimFire(db, issue, { id: routine.id, name: routine.name }, clock.now());
    if (!claimed.ok) {
      return err("wake.storage_failed");
    }
    let fire: StoredFire | null = claimed.value.kind === "claimed" ? claimed.value.fire : null;
    if (claimed.value.kind === "taken" && retry) {
      const existing = claimed.value.existing;
      const isStale = existing.status === "sending" && clock.now().getTime() - existing.updatedAt.getTime() >= STALE_FIRE_MS;
      if (existing.status === "failed" || existing.status === "queued" || isStale) {
        const tookOver = await takeOverFire(db, existing, clock.now(), true);
        if (!tookOver.ok) {
          return err("wake.storage_failed");
        }
        // A retry starts the 429 count again.
        fire = tookOver.value ? { ...existing, status: "sending", attempts: 0 } : null;
      }
    }
    if (fire !== null) {
      const fired = await fireClaimed(deps, fire, routine);
      if (!fired.ok) {
        return fired;
      }
    }
  }
  const fires = await findFires(db, [{ repositoryKey: issue.repositoryKey, issueNumber: issue.number }]);
  return fires.ok ? ok(summarize(fires.value)) : err("wake.storage_failed");
}

/** Wakes the project of an issue COCKPIT just created. Already recorded fires of the issue are left as they are. */
export function wakeIssue(deps: WakeDependencies, issue: FireIssue): Promise<Result<WakeSummary, WakeErrorCode>> {
  return wake(deps, issue, false);
}

/** Retry for one issue: fires again what failed, is queued or was left behind, and routines added since. */
export function retryIssueWake(deps: WakeDependencies, issue: FireIssue): Promise<Result<WakeSummary, WakeErrorCode>> {
  return wake(deps, issue, true);
}

/** The drain schedule: fires queued fires whose time has come and takes over stale ones. */
export async function drainQueuedFires(deps: WakeDependencies, limit = 50): Promise<Result<number, WakeErrorCode>> {
  const now = deps.clock.now();
  const due = await findDueFires(deps.db, now, new Date(now.getTime() - STALE_FIRE_MS), limit);
  if (!due.ok) {
    return err("wake.storage_failed");
  }
  const routineIds = [...new Set(due.value.flatMap((fire) => (fire.routineId === null ? [] : [fire.routineId])))];
  const found = await findRoutinesById(deps.db, routineIds);
  if (!found.ok) {
    return err("wake.storage_failed");
  }
  let fired = 0;
  for (const fire of due.value) {
    const tookOver = await takeOverFire(deps.db, fire, deps.clock.now());
    if (!tookOver.ok) {
      return err("wake.storage_failed");
    }
    if (!tookOver.value) {
      continue;
    }
    const result = await fireClaimed(deps, { ...fire, status: "sending" }, found.value.find((routine) => routine.id === fire.routineId));
    if (!result.ok) {
      return result;
    }
    fired += 1;
  }
  return ok(fired);
}

/** Wakes after an issue was created, logging a storage failure instead of returning it: the issue stays created. */
export async function wakeAfterIssue(deps: WakeDependencies | null, issue: FireIssue): Promise<WakeSummary | null> {
  if (deps === null) {
    return null;
  }
  const woke = await wakeIssue(deps, issue);
  if (!woke.ok) {
    logger.error("waking a project failed", { repository: issue.fullName, issue: issue.number, code: woke.error });
    return null;
  }
  return woke.value;
}

export type RetryErrorCode = WakeErrorCode | "wake.issue_unknown";

/** Retry for one issue named by its project and number: the issue's text comes from its recorded fires. */
export async function retryIssueWakeByNumber(deps: WakeDependencies, repositoryKey: string, issueNumber: number): Promise<Result<WakeSummary, RetryErrorCode>> {
  const fires = await findFires(deps.db, [{ repositoryKey, issueNumber }]);
  if (!fires.ok) {
    return err("wake.storage_failed");
  }
  const [first] = fires.value;
  if (first === undefined) {
    return err("wake.issue_unknown");
  }
  const retried = await retryIssueWake(deps, toIssue(first));
  logger.info("issue wake retried", { repository: first.fullName, issue: issueNumber, outcome: retried.ok ? "done" : retried.error });
  return retried;
}
