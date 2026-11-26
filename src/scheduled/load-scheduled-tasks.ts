// The scheduled tasks as the page lists them (CT-37): still to fire (scheduled or being sent) by planned time, and
// fired (sent or failed) newest first.
import { err, ok, type Result } from "@softure-ai/core";
import type { Queryable } from "@softure-ai/db";
import { findScheduledTasks, type StoredScheduledTask } from "../../modules/projects/scheduled-tasks.ts";
import type { ScheduledTaskErrorCode } from "./scheduled-task-errors.ts";

export interface ScheduledTaskLists {
  readonly upcoming: readonly StoredScheduledTask[];
  readonly done: readonly StoredScheduledTask[];
}

function getFiredTime(task: StoredScheduledTask): number {
  return (task.sentAt ?? task.claimedAt ?? task.runAt).getTime();
}

export async function loadScheduledTasks(db: Queryable): Promise<Result<ScheduledTaskLists, ScheduledTaskErrorCode>> {
  const tasks = await findScheduledTasks(db);
  if (!tasks.ok) {
    return err("scheduled.storage_failed");
  }
  const upcoming = tasks.value.filter((task) => task.status === "scheduled" || task.status === "sending");
  const done = tasks.value
    .filter((task) => task.status === "sent" || task.status === "failed")
    .sort((a, b) => getFiredTime(b) - getFiredTime(a));
  return ok({ upcoming, done });
}
