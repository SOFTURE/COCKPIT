// Scheduled tasks (CT-36): stored, edited while still scheduled, and claimed for a run. The claim is one conditional
// UPDATE over rows locked with SKIP LOCKED, so two workers or two ticks never take the same task; the run's broadcast
// id is set by the first claim and kept by every takeover, so a resent run is the same broadcast.
import { errorLogLabel, ok, safeError, type CoreErrorCode, type Err, type Result } from "@softure-ai/core";
import { createLogger } from "@softure-ai/observability";
import type { Queryable } from "@softure-ai/db";
import { and, asc, eq, ne, sql } from "drizzle-orm";
import { scheduledTasks } from "./schema.ts";

export type ScheduledTaskStatus = "scheduled" | "sending" | "sent" | "failed";

export interface StoredScheduledTask {
  readonly id: string;
  readonly title: string;
  readonly prompt: string;
  readonly repositoryKeys: readonly string[];
  /** The planned instant. */
  readonly runAt: Date;
  readonly status: ScheduledTaskStatus;
  /** The broadcast the run became; set by the claim, before anything is sent. */
  readonly broadcastId: string | null;
  readonly claimedAt: Date | null;
  readonly sentAt: Date | null;
  /** Projects of the task no longer watched when it fired. */
  readonly skippedKeys: readonly string[];
  /** Why a failed run sent nothing. */
  readonly failure: string | null;
  readonly createdBy: string;
  readonly createdByName: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface NewScheduledTask {
  readonly id: string;
  readonly title: string;
  readonly prompt: string;
  readonly repositoryKeys: readonly string[];
  readonly runAt: Date;
  readonly createdBy: string;
  readonly createdByName: string | null;
  readonly at: Date;
}

export interface ScheduledTaskChange {
  readonly title: string;
  readonly prompt: string;
  readonly repositoryKeys: readonly string[];
  readonly runAt: Date;
  readonly at: Date;
}

export interface DueClaim {
  readonly at: Date;
  /** A run still `sending` claimed at or before this instant belongs to a worker that died. */
  readonly staleBefore: Date;
  readonly limit: number;
}

type Row = typeof scheduledTasks.$inferSelect;

/** Raw rows (from `execute`) come back with snake_case columns. */
type RawRow = {
  readonly id: string;
  readonly title: string;
  readonly prompt: string;
  readonly repository_keys: string[];
  readonly run_at: Date | string;
  readonly status: string;
  readonly broadcast_id: string | null;
  readonly claimed_at: Date | string | null;
  readonly sent_at: Date | string | null;
  readonly skipped_keys: string[];
  readonly failure: string | null;
  readonly created_by: string;
  readonly created_by_name: string | null;
  readonly created_at: Date | string;
  readonly updated_at: Date | string;
};

function toDate(value: Date | string): Date;
function toDate(value: Date | string | null): Date | null;
function toDate(value: Date | string | null): Date | null {
  return value === null ? null : new Date(value);
}

function toStoredTask(row: Row): StoredScheduledTask {
  // The table's check holds the status to its set.
  return { ...row, status: row.status as ScheduledTaskStatus };
}

function fromRawRow(row: RawRow): StoredScheduledTask {
  return {
    id: row.id,
    title: row.title,
    prompt: row.prompt,
    repositoryKeys: row.repository_keys,
    runAt: toDate(row.run_at),
    // The table's check holds the status to its set.
    status: row.status as ScheduledTaskStatus,
    broadcastId: row.broadcast_id,
    claimedAt: toDate(row.claimed_at),
    sentAt: toDate(row.sent_at),
    skippedKeys: row.skipped_keys,
    failure: row.failure,
    createdBy: row.created_by,
    createdByName: row.created_by_name,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
}

/** Stores a new task unless one with its id exists (a resubmitted form); returns the stored one either way. */
export async function insertScheduledTask(db: Queryable, task: NewScheduledTask): Promise<Result<StoredScheduledTask>> {
  try {
    await db
      .insert(scheduledTasks)
      .values({
        id: task.id,
        title: task.title,
        prompt: task.prompt,
        repositoryKeys: [...task.repositoryKeys],
        runAt: task.runAt,
        status: "scheduled",
        skippedKeys: [],
        createdBy: task.createdBy,
        createdByName: task.createdByName,
        createdAt: task.at,
        updatedAt: task.at,
      })
      .onConflictDoNothing({ target: scheduledTasks.id });
    const [row] = await db.select().from(scheduledTasks).where(eq(scheduledTasks.id, task.id));
    if (row === undefined) {
      return fail("saving a scheduled task", new Error("the scheduled task was not stored"));
    }
    return ok(toStoredTask(row));
  } catch (error) {
    return fail("saving a scheduled task", error);
  }
}

/** Changes a task that is still `scheduled`; returns whether one was changed. */
export async function updateScheduledTask(db: Queryable, id: string, change: ScheduledTaskChange): Promise<Result<boolean>> {
  try {
    const updated = await db
      .update(scheduledTasks)
      .set({ title: change.title, prompt: change.prompt, repositoryKeys: [...change.repositoryKeys], runAt: change.runAt, updatedAt: change.at })
      .where(and(eq(scheduledTasks.id, id), eq(scheduledTasks.status, "scheduled")))
      .returning({ id: scheduledTasks.id });
    return ok(updated.length === 1);
  } catch (error) {
    return fail("updating a scheduled task", error);
  }
}

/** Removes a task unless a run is sending it; its broadcast and issues stay. Returns whether one was removed. */
export async function deleteScheduledTask(db: Queryable, id: string): Promise<Result<boolean>> {
  try {
    const deleted = await db
      .delete(scheduledTasks)
      .where(and(eq(scheduledTasks.id, id), ne(scheduledTasks.status, "sending")))
      .returning({ id: scheduledTasks.id });
    return ok(deleted.length === 1);
  } catch (error) {
    return fail("deleting a scheduled task", error);
  }
}

export async function findScheduledTask(db: Queryable, id: string): Promise<Result<StoredScheduledTask | null>> {
  try {
    const [row] = await db.select().from(scheduledTasks).where(eq(scheduledTasks.id, id));
    return ok(row === undefined ? null : toStoredTask(row));
  } catch (error) {
    return fail("reading a scheduled task", error);
  }
}

/** Every task, by planned time. */
export async function findScheduledTasks(db: Queryable): Promise<Result<StoredScheduledTask[]>> {
  try {
    const rows = await db.select().from(scheduledTasks).orderBy(asc(scheduledTasks.runAt), asc(scheduledTasks.id));
    return ok(rows.map(toStoredTask));
  } catch (error) {
    return fail("listing scheduled tasks", error);
  }
}

/** What every claim sets: the run's broadcast id is made once and kept by every takeover. */
function claimSet(at: Date) {
  return sql`status = 'sending', claimed_at = ${at}, updated_at = ${at}, broadcast_id = coalesce(broadcast_id, gen_random_uuid())`;
}

/** Claims the due tasks and the runs a dead worker left `sending`; each is returned to exactly one caller. */
export async function claimDueScheduledTasks(db: Queryable, claim: DueClaim): Promise<Result<StoredScheduledTask[]>> {
  try {
    const claimed = await db.execute<RawRow>(sql`
      update projects.scheduled_tasks set ${claimSet(claim.at)}
      where id in (
        select id from projects.scheduled_tasks
        where (status = 'scheduled' and run_at <= ${claim.at}) or (status = 'sending' and claimed_at <= ${claim.staleBefore})
        order by run_at, id
        limit ${claim.limit}
        for update skip locked
      )
      and ((status = 'scheduled' and run_at <= ${claim.at}) or (status = 'sending' and claimed_at <= ${claim.staleBefore}))
      returning *`);
    return ok(claimed.rows.map(fromRawRow).sort((a, b) => a.runAt.getTime() - b.runAt.getTime()));
  } catch (error) {
    return fail("claiming due scheduled tasks", error);
  }
}

/** Claims one `scheduled` task now ("Run now"), whatever its planned time; null when it is not scheduled. */
export async function claimScheduledTaskNow(db: Queryable, id: string, at: Date): Promise<Result<StoredScheduledTask | null>> {
  try {
    const claimed = await db.execute<RawRow>(sql`
      update projects.scheduled_tasks set ${claimSet(at)}
      where id = ${id} and status = 'scheduled'
      returning *`);
    const [row] = claimed.rows;
    return ok(row === undefined ? null : fromRawRow(row));
  } catch (error) {
    return fail("claiming a scheduled task", error);
  }
}

export interface RunRecord {
  readonly id: string;
  /** The run's claim, so a run taken over since cannot be recorded by the worker it was taken from. */
  readonly claimedAt: Date;
  readonly skippedKeys: readonly string[];
  readonly at: Date;
}

/** Records a claimed run as sent; returns whether this run still held the task. */
export async function markScheduledTaskSent(db: Queryable, record: RunRecord): Promise<Result<boolean>> {
  try {
    const updated = await db
      .update(scheduledTasks)
      .set({ status: "sent", sentAt: record.at, skippedKeys: [...record.skippedKeys], failure: null, updatedAt: record.at })
      .where(and(eq(scheduledTasks.id, record.id), eq(scheduledTasks.status, "sending"), eq(scheduledTasks.claimedAt, record.claimedAt)))
      .returning({ id: scheduledTasks.id });
    return ok(updated.length === 1);
  } catch (error) {
    return fail("recording a sent scheduled task", error);
  }
}

/** Records a claimed run that could send nothing, with its reason; returns whether this run still held the task. */
export async function markScheduledTaskFailed(db: Queryable, record: RunRecord & { readonly failure: string }): Promise<Result<boolean>> {
  try {
    const updated = await db
      .update(scheduledTasks)
      .set({ status: "failed", failure: record.failure, skippedKeys: [...record.skippedKeys], updatedAt: record.at })
      .where(and(eq(scheduledTasks.id, record.id), eq(scheduledTasks.status, "sending"), eq(scheduledTasks.claimedAt, record.claimedAt)))
      .returning({ id: scheduledTasks.id });
    return ok(updated.length === 1);
  } catch (error) {
    return fail("recording a failed scheduled task", error);
  }
}

const logger = createLogger("projects");

function fail(operation: string, error: unknown): Err<CoreErrorCode> {
  // The label names the error class and its safe code, never its text (a database error can hold the values).
  logger.error("storage call failed", { operation, error: errorLogLabel(error) });
  return safeError(error);
}
