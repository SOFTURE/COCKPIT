// The Scheduled tasks page's data (CT-37): the tasks still to fire, soonest first, and the fired ones, newest first,
// each with how far its run got. Reads COCKPIT's own tables only (tasks and broadcast sends; no forge call).
import { err, ok, type Result } from "@softure-ai/core";
import type { Queryable } from "@softure-ai/db";
import { findSends } from "../../modules/projects/broadcasts.ts";
import { buildDoneRow, buildScheduledRow, groupSendsByBroadcast, type DoneRow, type ScheduledRow } from "./build-scheduled-rows.ts";
import { loadScheduledTasks } from "./load-scheduled-tasks.ts";
import type { ScheduledTaskErrorCode } from "./scheduled-task-errors.ts";

export interface ScheduledPageData {
  readonly scheduled: readonly ScheduledRow[];
  readonly done: readonly DoneRow[];
}

export async function loadScheduledPage(db: Queryable): Promise<Result<ScheduledPageData, ScheduledTaskErrorCode>> {
  const [tasks, sends] = await Promise.all([loadScheduledTasks(db), findSends(db, null)]);
  if (!tasks.ok) {
    return tasks;
  }
  if (!sends.ok) {
    return err("scheduled.storage_failed");
  }
  const sendsByBroadcast = groupSendsByBroadcast(sends.value);
  return ok({
    scheduled: tasks.value.upcoming.map(buildScheduledRow),
    done: tasks.value.done.map((task) => buildDoneRow(task, sendsByBroadcast)),
  });
}
