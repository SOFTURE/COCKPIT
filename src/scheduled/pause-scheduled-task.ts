// Pausing and resuming a scheduled task (CT-39). A paused task does not fire. Resuming a repeating task whose time
// passed while it was paused moves it to its next time after now, so the paused runs are skipped; a one-off task keeps
// its time and, when that has passed, fires on the next tick like any missed time.
import { err, ok, type Clock, type Result } from "@softure-ai/core";
import type { Queryable } from "@softure-ai/db";
import { findScheduledTask, setScheduledTaskPaused } from "../../modules/projects/scheduled-tasks.ts";
import { getNextRunAt } from "./next-run-at.ts";
import type { ScheduledTaskErrorCode } from "./scheduled-task-errors.ts";

export interface PauseContext {
  readonly db: Queryable;
  readonly clock: Clock;
  readonly timeZone: string;
}

/** Pauses or resumes a task that has not fired yet; a run being sent or already done is refused. */
export async function setScheduledTaskPause(context: PauseContext, id: string, isPaused: boolean): Promise<Result<undefined, ScheduledTaskErrorCode>> {
  const existing = await findScheduledTask(context.db, id);
  if (!existing.ok) {
    return err("scheduled.storage_failed");
  }
  const task = existing.value;
  if (task === null) {
    return err("scheduled.not_found");
  }
  if (task.status !== "scheduled") {
    return err("scheduled.not_scheduled");
  }
  const now = context.clock.now();
  const hasPassed = task.runAt.getTime() <= now.getTime();
  const runAt = !isPaused && hasPassed ? getNextRunAt({ plannedAt: task.runAt, repeat: task.repeat, now, timeZone: context.timeZone }) : null;
  const changed = await setScheduledTaskPaused(context.db, { id, isPaused, runAt, at: now });
  if (!changed.ok) {
    return err("scheduled.storage_failed");
  }
  // A tick may have claimed it between the read and the update.
  return changed.value ? ok(undefined) : err("scheduled.not_scheduled");
}
