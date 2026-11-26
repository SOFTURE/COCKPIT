// Deleting a scheduled task (CT-36): a scheduled one is dropped before it fires; a sent or failed one loses only its
// entry, while its broadcast and issues stay in Broadcast history. A run being sent cannot be deleted.
import { err, ok, type Result } from "@softure-ai/core";
import type { Queryable } from "@softure-ai/db";
import { deleteScheduledTask, findScheduledTask } from "../../modules/projects/scheduled-tasks.ts";
import type { ScheduledTaskErrorCode } from "./scheduled-task-errors.ts";

/** Returns whether a task was removed; an id already gone is no failure (a second click, another tab). */
export async function removeScheduledTask(db: Queryable, id: string): Promise<Result<boolean, ScheduledTaskErrorCode>> {
  const deleted = await deleteScheduledTask(db, id);
  if (!deleted.ok) {
    return err("scheduled.storage_failed");
  }
  if (deleted.value) {
    return ok(true);
  }
  const existing = await findScheduledTask(db, id);
  if (!existing.ok) {
    return err("scheduled.storage_failed");
  }
  return existing.value?.status === "sending" ? err("scheduled.not_deletable") : ok(false);
}
