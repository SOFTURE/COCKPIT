// Scheduled tasks (CT-36): stored, edited while still scheduled, and claimed for a run. The claim is one conditional
// UPDATE over rows locked with SKIP LOCKED, so two workers or two ticks never take the same task; the run's broadcast
// id is set by the first claim and kept by every takeover, so a resent run is the same broadcast. A row is one planned
// run; the runs of a repeating task (CT-39) share a series, and the claim that takes a repeating run from `scheduled`
// inserts the series' next run in the same transaction, guarded by the unique (series, planned time) run key.
import { errorLogLabel, ok, safeError, type CoreErrorCode, type Err, type Result } from "@softure-ai/core";
import { createLogger } from "@softure-ai/observability";
import type { Queryable } from "@softure-ai/db";
import { and, asc, eq, ne, sql } from "drizzle-orm";
import { scheduledTasks } from "./schema.ts";

export type ScheduledTaskStatus = "scheduled" | "sending" | "sent" | "failed";

/** How a task repeats: once, every day or every week at the same local time. */
export type ScheduledTaskRepeat = "none" | "daily" | "weekly";

export const SCHEDULED_TASK_REPEATS: readonly ScheduledTaskRepeat[] = ["none", "daily", "weekly"];

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
  readonly repeat: ScheduledTaskRepeat;
  /** A paused run does not fire; only a `scheduled` run can be paused. */
  readonly paused: boolean;
  /** Shared by every run of one repeating task; a one-off task's own id. */
  readonly seriesId: string;
}

export interface NewScheduledTask {
  readonly id: string;
  readonly title: string;
  readonly prompt: string;
  readonly repositoryKeys: readonly string[];
  readonly runAt: Date;
  /** Once when not given. */
  readonly repeat?: ScheduledTaskRepeat;
  readonly createdBy: string;
  readonly createdByName: string | null;
  readonly at: Date;
}

export interface ScheduledTaskChange {
  readonly title: string;
  readonly prompt: string;
  readonly repositoryKeys: readonly string[];
  readonly runAt: Date;
  readonly repeat: ScheduledTaskRepeat;
  readonly at: Date;
}

/** The next planned time of a repeating run that is claimed at `now`, or null when it does not repeat. */
export type NextRunAt = (task: Pick<StoredScheduledTask, "runAt" | "repeat">, now: Date) => Date | null;

export interface DueClaim {
  readonly at: Date;
  /** A run still `sending` claimed at or before this instant belongs to a worker that died. */
  readonly staleBefore: Date;
  readonly limit: number;
  /** Where a claimed repeating run's series goes next. */
  readonly getNextRunAt: NextRunAt;
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
  readonly repeat: string;
  readonly paused: boolean;
  readonly series_id: string;
};

function toDate(value: Date | string): Date;
function toDate(value: Date | string | null): Date | null;
function toDate(value: Date | string | null): Date | null {
  return value === null ? null : new Date(value);
}

function toStoredTask(row: Row): StoredScheduledTask {
  // The table's checks hold the status and the repeat to their sets.
  return { ...row, status: row.status as ScheduledTaskStatus, repeat: row.repeat as ScheduledTaskRepeat };
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
    // The table's check holds the repeat to its set.
    repeat: row.repeat as ScheduledTaskRepeat,
    paused: row.paused,
    seriesId: row.series_id,
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
        repeat: task.repeat ?? "none",
        paused: false,
        seriesId: task.id,
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
      .set({
        title: change.title,
        prompt: change.prompt,
        repositoryKeys: [...change.repositoryKeys],
        runAt: change.runAt,
        repeat: change.repeat,
        updatedAt: change.at,
      })
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
  return sql`status = 'sending', paused = false, claimed_at = ${at}, updated_at = ${at}, broadcast_id = coalesce(broadcast_id, gen_random_uuid())`;
}

type ClaimedRawRow = RawRow & { readonly previous_status: string };

/** Inserts the series' next run, a copy of the claimed run at `runAt`; a run already planned for that time wins. */
async function insertNextRun(db: Queryable, claimedId: string, runAt: Date, at: Date): Promise<void> {
  await db.execute(sql`
    insert into projects.scheduled_tasks
      (id, title, prompt, repository_keys, run_at, status, skipped_keys, created_by, created_by_name, created_at, updated_at, repeat, paused, series_id)
    select gen_random_uuid(), title, prompt, repository_keys, ${runAt}, 'scheduled', '{}', created_by, created_by_name, ${at}, ${at},
      repeat, false, series_id
    from projects.scheduled_tasks
    where id = ${claimedId}
    on conflict do nothing`);
}

/**
 * Claims the due tasks and the runs a dead worker left `sending`; each is returned to exactly one caller. A repeating
 * run taken from `scheduled` gets its series' next run in the same transaction; a takeover gets none (it had one).
 */
export async function claimDueScheduledTasks(db: Queryable, claim: DueClaim): Promise<Result<StoredScheduledTask[]>> {
  const isDue = sql`((t.status = 'scheduled' and not t.paused and t.run_at <= ${claim.at}) or (t.status = 'sending' and t.claimed_at <= ${claim.staleBefore}))`;
  try {
    const claimed = await db.transaction(async (tx) => {
      const rows = await tx.execute<ClaimedRawRow>(sql`
        with due as (
          select t.id, t.status as previous_status from projects.scheduled_tasks t
          where ${isDue}
          order by t.run_at, t.id
          limit ${claim.limit}
          for update skip locked
        )
        update projects.scheduled_tasks t set ${claimSet(claim.at)}
        from due
        where t.id = due.id and ${isDue}
        returning t.*, due.previous_status`);
      const tasks = rows.rows.map((row) => ({ task: fromRawRow(row), wasScheduled: row.previous_status === "scheduled" }));
      for (const { task, wasScheduled } of tasks) {
        const next = wasScheduled ? claim.getNextRunAt(task, claim.at) : null;
        if (next !== null) {
          await insertNextRun(tx, task.id, next, claim.at);
        }
      }
      return tasks.map(({ task }) => task);
    });
    return ok(claimed.sort((a, b) => a.runAt.getTime() - b.runAt.getTime()));
  } catch (error) {
    return fail("claiming due scheduled tasks", error);
  }
}

/** Claims one `scheduled` one-off task now ("Run now"), whatever its planned time; null when there is none to claim. */
export async function claimScheduledTaskNow(db: Queryable, id: string, at: Date): Promise<Result<StoredScheduledTask | null>> {
  try {
    const claimed = await db.execute<RawRow>(sql`
      update projects.scheduled_tasks set ${claimSet(at)}
      where id = ${id} and status = 'scheduled' and repeat = 'none'
      returning *`);
    const [row] = claimed.rows;
    return ok(row === undefined ? null : fromRawRow(row));
  } catch (error) {
    return fail("claiming a scheduled task", error);
  }
}

/**
 * "Run now" on a repeating task: a one-off copy of its upcoming run, claimed as it is stored, so the series keeps its
 * planned time. Null when the task is not an upcoming repeating run.
 */
export async function claimRepeatingRunNow(db: Queryable, id: string, at: Date): Promise<Result<StoredScheduledTask | null>> {
  try {
    const claimed = await db.execute<RawRow>(sql`
      insert into projects.scheduled_tasks
        (id, title, prompt, repository_keys, run_at, status, broadcast_id, claimed_at, skipped_keys, created_by, created_by_name,
         created_at, updated_at, repeat, paused, series_id)
      select gen_random_uuid(), title, prompt, repository_keys, ${at}, 'sending', gen_random_uuid(), ${at}, '{}', created_by,
        created_by_name, ${at}, ${at}, 'none', false, series_id
      from projects.scheduled_tasks
      where id = ${id} and status = 'scheduled' and repeat <> 'none'
      on conflict do nothing
      returning *`);
    const [row] = claimed.rows;
    return ok(row === undefined ? null : fromRawRow(row));
  } catch (error) {
    return fail("running a repeating scheduled task now", error);
  }
}

export interface PauseChange {
  readonly id: string;
  readonly isPaused: boolean;
  /** Where a resumed repeating run moves when its time passed while it was paused; null keeps its time. */
  readonly runAt: Date | null;
  readonly at: Date;
}

/** Pauses or resumes a `scheduled` run; returns whether one was changed. */
export async function setScheduledTaskPaused(db: Queryable, change: PauseChange): Promise<Result<boolean>> {
  try {
    const updated = await db
      .update(scheduledTasks)
      .set({ paused: change.isPaused, updatedAt: change.at, ...(change.runAt === null ? {} : { runAt: change.runAt }) })
      .where(and(eq(scheduledTasks.id, change.id), eq(scheduledTasks.status, "scheduled")))
      .returning({ id: scheduledTasks.id });
    return ok(updated.length === 1);
  } catch (error) {
    return fail(change.isPaused ? "pausing a scheduled task" : "resuming a scheduled task", error);
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
