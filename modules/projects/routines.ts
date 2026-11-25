// The routines COCKPIT fires (CT-10), their fires per issue and the log the hourly limits count. A fire row is
// claimed before the call; the unique index on the project, the issue and the routine lets exactly one claim win.
// The limits are checked and the call logged in one transaction under an advisory lock, so two requests never both
// take the last free call of an hour.
import { errorLogLabel, ok, safeError, type CoreErrorCode, type Err, type Result } from "@softure-ai/core";
import { createLogger } from "@softure-ai/observability";
import type { Queryable } from "@softure-ai/db";
import { and, asc, desc, eq, inArray, lt, lte, or, sql } from "drizzle-orm";
import { fireLog, routineFires, routines } from "./schema.ts";

/** The only kind COCKPIT fires today; the field stays open for more. */
export const COCKPIT_ISSUES_KIND = "cockpit-issues";

export interface StoredRoutine {
  readonly id: number;
  readonly repositoryKey: string;
  readonly name: string;
  readonly kind: string;
  readonly triggerId: string;
  /** The sealed token (token-box.ts); never leaves the server. */
  readonly tokenCiphertext: string;
  readonly tokenLast4: string;
  readonly enabled: boolean;
  readonly lastFireOk: boolean | null;
  readonly lastFireStatus: number | null;
  readonly lastFireAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface NewRoutine {
  readonly repositoryKey: string;
  readonly name: string;
  readonly kind: string;
  readonly triggerId: string;
  readonly tokenCiphertext: string;
  readonly tokenLast4: string;
  readonly enabled: boolean;
  readonly at: Date;
}

export interface RoutineChange {
  readonly name?: string;
  readonly kind?: string;
  readonly triggerId?: string;
  readonly token?: { readonly ciphertext: string; readonly last4: string };
  readonly enabled?: boolean;
}

export type FireStatus = "sending" | "sent" | "failed" | "queued" | "no_routine";

export interface StoredFire {
  readonly id: number;
  readonly repositoryKey: string;
  readonly fullName: string;
  readonly issueNumber: number;
  readonly issueUrl: string;
  readonly issueTitle: string;
  /** Null on a `no_routine` row. */
  readonly routineId: number | null;
  readonly routineName: string | null;
  readonly status: FireStatus;
  readonly httpStatus: number | null;
  readonly reason: string | null;
  readonly attempts: number;
  readonly nextAttemptAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface FireIssue {
  readonly repositoryKey: string;
  readonly fullName: string;
  readonly number: number;
  readonly url: string;
  readonly title: string;
}

export type FireClaim = { readonly kind: "claimed"; readonly fire: StoredFire } | { readonly kind: "taken"; readonly existing: StoredFire };

export interface FireOutcome {
  readonly status: Exclude<FireStatus, "sending" | "no_routine">;
  readonly httpStatus: number | null;
  readonly reason: string | null;
  readonly nextAttemptAt: Date | null;
  readonly at: Date;
}

export interface FireLimits {
  readonly perRoutine: number;
  readonly total: number;
  readonly windowMs: number;
}

export type FireReservation = { readonly kind: "reserved" } | { readonly kind: "limited"; readonly freeAt: Date };

function toRoutine(row: typeof routines.$inferSelect): StoredRoutine {
  return { ...row };
}

function toFire(row: typeof routineFires.$inferSelect): StoredFire {
  // The table's check holds the status to its set.
  return { ...row, status: row.status as FireStatus };
}

export async function findRoutines(db: Queryable, repositoryKey?: string): Promise<Result<StoredRoutine[]>> {
  try {
    const rows = await db
      .select()
      .from(routines)
      .where(repositoryKey === undefined ? undefined : eq(routines.repositoryKey, repositoryKey))
      .orderBy(asc(routines.repositoryKey), asc(routines.id));
    return ok(rows.map(toRoutine));
  } catch (error) {
    return fail("reading routines", error);
  }
}

export async function findRoutine(db: Queryable, id: number): Promise<Result<StoredRoutine | null>> {
  try {
    const [row] = await db.select().from(routines).where(eq(routines.id, id));
    return ok(row === undefined ? null : toRoutine(row));
  } catch (error) {
    return fail("reading a routine", error);
  }
}

export async function addRoutine(db: Queryable, routine: NewRoutine): Promise<Result<StoredRoutine>> {
  try {
    const { at, ...values } = routine;
    const [row] = await db
      .insert(routines)
      .values({ ...values, createdAt: at, updatedAt: at })
      .returning();
    if (row === undefined) {
      return fail("adding a routine", new Error("the routine was not stored"));
    }
    return ok(toRoutine(row));
  } catch (error) {
    return fail("adding a routine", error);
  }
}

/** Changes one routine of the project; false when the project has no routine with that id. */
export async function updateRoutine(db: Queryable, repositoryKey: string, id: number, change: RoutineChange, at: Date): Promise<Result<boolean>> {
  const { token, ...rest } = change;
  try {
    const rows = await db
      .update(routines)
      .set({ ...rest, ...(token === undefined ? {} : { tokenCiphertext: token.ciphertext, tokenLast4: token.last4 }), updatedAt: at })
      .where(and(eq(routines.id, id), eq(routines.repositoryKey, repositoryKey)))
      .returning({ id: routines.id });
    return ok(rows.length > 0);
  } catch (error) {
    return fail("changing a routine", error);
  }
}

export async function deleteRoutine(db: Queryable, repositoryKey: string, id: number): Promise<Result<boolean>> {
  try {
    const rows = await db
      .delete(routines)
      .where(and(eq(routines.id, id), eq(routines.repositoryKey, repositoryKey)))
      .returning({ id: routines.id });
    return ok(rows.length > 0);
  } catch (error) {
    return fail("deleting a routine", error);
  }
}

/** Keeps the result of a routine's latest call (a fire or a test): the overview's "wakes on its own" reads it. */
export async function recordRoutineCall(db: Queryable, id: number, call: { readonly ok: boolean; readonly status: number | null; readonly at: Date }): Promise<Result<undefined>> {
  try {
    await db.update(routines).set({ lastFireOk: call.ok, lastFireStatus: call.status, lastFireAt: call.at }).where(eq(routines.id, id));
    return ok();
  } catch (error) {
    return fail("recording a routine call", error);
  }
}

/** A lock key of its own for the limit check (any constant other code does not use). */
const FIRE_LIMIT_LOCK = 7_310_401;

/**
 * Takes one call of the hour for the routine when both limits allow it, and logs it; otherwise names when the oldest
 * call in the way leaves the window.
 */
export async function reserveCall(db: Queryable, routineId: number, at: Date, limits: FireLimits): Promise<Result<FireReservation>> {
  const since = new Date(at.getTime() - limits.windowMs);
  try {
    return ok(
      await db.transaction(async (tx) => {
        await tx.execute(sql`select pg_advisory_xact_lock(${FIRE_LIMIT_LOCK})`);
        await tx.delete(fireLog).where(lt(fireLog.firedAt, new Date(at.getTime() - 24 * limits.windowMs)));
        const recent = await tx
          .select({ routineId: fireLog.routineId, firedAt: fireLog.firedAt })
          .from(fireLog)
          .where(sql`${fireLog.firedAt} > ${since}`)
          .orderBy(asc(fireLog.firedAt));
        const own = recent.filter((call) => call.routineId === routineId);
        const blocking = own.length >= limits.perRoutine ? own[own.length - limits.perRoutine] : recent.length >= limits.total ? recent[recent.length - limits.total] : undefined;
        if (blocking !== undefined) {
          return { kind: "limited", freeAt: new Date(blocking.firedAt.getTime() + limits.windowMs) } as const;
        }
        await tx.insert(fireLog).values({ routineId, firedAt: at });
        return { kind: "reserved" } as const;
      }),
    );
  } catch (error) {
    return fail("reserving a routine call", error);
  }
}

/** Claims the fire of one issue by one routine (or the issue's `no_routine` row); returns the row that holds it. */
export async function claimFire(
  db: Queryable,
  issue: FireIssue,
  routine: { readonly id: number; readonly name: string } | null,
  at: Date,
): Promise<Result<FireClaim>> {
  try {
    const [row] = await db
      .insert(routineFires)
      .values({
        repositoryKey: issue.repositoryKey,
        fullName: issue.fullName,
        issueNumber: issue.number,
        issueUrl: issue.url,
        issueTitle: issue.title,
        routineId: routine?.id ?? null,
        routineName: routine?.name ?? null,
        status: routine === null ? "no_routine" : "sending",
        attempts: 0,
        createdAt: at,
        updatedAt: at,
      })
      .onConflictDoNothing()
      .returning();
    if (row !== undefined) {
      return ok({ kind: "claimed", fire: toFire(row) });
    }
    const [existing] = await db
      .select()
      .from(routineFires)
      .where(
        and(
          eq(routineFires.repositoryKey, issue.repositoryKey),
          eq(routineFires.issueNumber, issue.number),
          routine === null ? sql`${routineFires.routineId} is null` : eq(routineFires.routineId, routine.id),
        ),
      );
    if (existing === undefined) {
      return fail("claiming a fire", new Error("the fire was neither stored nor found"));
    }
    return ok({ kind: "taken", existing: toFire(existing) });
  } catch (error) {
    return fail("claiming a fire", error);
  }
}

/** Takes a failed, queued or stale fire back to `sending`; false when another request took it first. */
export async function takeOverFire(db: Queryable, fire: StoredFire, at: Date, resetAttempts = false): Promise<Result<boolean>> {
  try {
    const rows = await db
      .update(routineFires)
      .set({ status: "sending", updatedAt: at, ...(resetAttempts ? { attempts: 0 } : {}) })
      .where(and(eq(routineFires.id, fire.id), eq(routineFires.status, fire.status), eq(routineFires.updatedAt, fire.updatedAt)))
      .returning({ id: routineFires.id });
    return ok(rows.length > 0);
  } catch (error) {
    return fail("taking over a fire", error);
  }
}

export async function markFire(db: Queryable, id: number, outcome: FireOutcome): Promise<Result<undefined>> {
  try {
    await db
      .update(routineFires)
      .set({
        status: outcome.status,
        httpStatus: outcome.httpStatus,
        reason: outcome.reason,
        nextAttemptAt: outcome.nextAttemptAt,
        attempts: sql`${routineFires.attempts} + 1`,
        updatedAt: outcome.at,
      })
      .where(and(eq(routineFires.id, id), eq(routineFires.status, "sending")));
    return ok();
  } catch (error) {
    return fail("recording a fire", error);
  }
}

/** Removes the issue's `no_routine` row, so a retry after a routine was added fires it. */
export async function clearNoRoutine(db: Queryable, repositoryKey: string, issueNumber: number): Promise<Result<undefined>> {
  try {
    await db
      .delete(routineFires)
      .where(and(eq(routineFires.repositoryKey, repositoryKey), eq(routineFires.issueNumber, issueNumber), eq(routineFires.status, "no_routine")));
    return ok();
  } catch (error) {
    return fail("clearing a no-routine fire", error);
  }
}

export interface IssueRef {
  readonly repositoryKey: string;
  readonly issueNumber: number;
}

/** The fires of the given issues, oldest first. */
export async function findFires(db: Queryable, issues: readonly IssueRef[]): Promise<Result<StoredFire[]>> {
  if (issues.length === 0) {
    return ok([]);
  }
  try {
    const rows = await db
      .select()
      .from(routineFires)
      .where(or(...issues.map((issue) => and(eq(routineFires.repositoryKey, issue.repositoryKey), eq(routineFires.issueNumber, issue.issueNumber)))))
      .orderBy(asc(routineFires.id));
    return ok(rows.map(toFire));
  } catch (error) {
    return fail("reading fires", error);
  }
}

/** A project's latest fires, newest first. */
export async function findRecentFires(db: Queryable, repositoryKey: string, limit: number): Promise<Result<StoredFire[]>> {
  try {
    const rows = await db
      .select()
      .from(routineFires)
      .where(eq(routineFires.repositoryKey, repositoryKey))
      .orderBy(desc(routineFires.id))
      .limit(limit);
    return ok(rows.map(toFire));
  } catch (error) {
    return fail("reading recent fires", error);
  }
}

/** Queued fires whose time has come, and `sending` ones a request left behind before `staleBefore`. */
export async function findDueFires(db: Queryable, at: Date, staleBefore: Date, limit: number): Promise<Result<StoredFire[]>> {
  try {
    const rows = await db
      .select()
      .from(routineFires)
      .where(
        or(
          and(eq(routineFires.status, "queued"), lte(routineFires.nextAttemptAt, at)),
          and(eq(routineFires.status, "sending"), lte(routineFires.updatedAt, staleBefore)),
        ),
      )
      .orderBy(asc(routineFires.nextAttemptAt), asc(routineFires.id))
      .limit(limit);
    return ok(rows.map(toFire));
  } catch (error) {
    return fail("reading due fires", error);
  }
}

/** The routines with these ids (a fire's routine may have been deleted since). */
export async function findRoutinesById(db: Queryable, ids: readonly number[]): Promise<Result<StoredRoutine[]>> {
  if (ids.length === 0) {
    return ok([]);
  }
  try {
    const rows = await db.select().from(routines).where(inArray(routines.id, [...ids]));
    return ok(rows.map(toRoutine));
  } catch (error) {
    return fail("reading routines by id", error);
  }
}

const logger = createLogger("projects");

function fail(operation: string, error: unknown): Err<CoreErrorCode> {
  // The label names the error class and its safe code, never its text (a database error can hold the values).
  logger.error("storage call failed", { operation, error: errorLogLabel(error) });
  return safeError(error);
}
