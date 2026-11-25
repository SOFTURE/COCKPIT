// Broadcasts (CV-1) and their per-project sends. A send is claimed before the forge call; the unique index on the
// broadcast and the project lets exactly one claim win, however many sends of the same broadcast arrive at once.
import { errorLogLabel, ok, safeError, type CoreErrorCode, type Err, type Result } from "@softure-ai/core";
import { createLogger } from "@softure-ai/observability";
import type { Queryable } from "@softure-ai/db";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { broadcastSends, broadcasts } from "./schema.ts";

export type SendStatus = "creating" | "sent" | "failed";

export interface StoredBroadcast {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly sentBy: string;
  /** The sender's display name or email when they sent it. */
  readonly sentByName: string | null;
  readonly createdAt: Date;
}

export interface StoredSend {
  readonly id: number;
  readonly broadcastId: string;
  readonly repositoryKey: string;
  readonly fullName: string;
  readonly status: SendStatus;
  /** The reason code of a failed send. */
  readonly failure: string | null;
  /** The label of the token the forge refused, when a token's permissions explain the failure. */
  readonly failureToken: string | null;
  readonly issueNumber: number | null;
  readonly issueUrl: string | null;
  readonly updatedAt: Date;
}

export interface NewSend {
  readonly broadcastId: string;
  readonly repositoryKey: string;
  readonly fullName: string;
  readonly at: Date;
}

export type SendClaim = { readonly kind: "claimed"; readonly id: number } | { readonly kind: "taken"; readonly existing: StoredSend };

function toStoredSend(row: typeof broadcastSends.$inferSelect): StoredSend {
  return {
    id: row.id,
    broadcastId: row.broadcastId,
    repositoryKey: row.repositoryKey,
    fullName: row.fullName,
    // The table's check holds the status to its set.
    status: row.status as SendStatus,
    failure: row.failure,
    failureToken: row.failureToken,
    issueNumber: row.issueNumber,
    issueUrl: row.issueUrl,
    updatedAt: row.updatedAt,
  };
}

/** Stores the broadcast unless one with its id exists; returns the stored one either way. */
export async function saveBroadcast(db: Queryable, broadcast: StoredBroadcast): Promise<Result<StoredBroadcast>> {
  try {
    await db.insert(broadcasts).values({ ...broadcast }).onConflictDoNothing({ target: broadcasts.id });
    const [row] = await db.select().from(broadcasts).where(eq(broadcasts.id, broadcast.id));
    if (row === undefined) {
      return fail("saving a broadcast", new Error("the broadcast was not stored"));
    }
    return ok(row);
  } catch (error) {
    return fail("saving a broadcast", error);
  }
}

export async function findBroadcast(db: Queryable, id: string): Promise<Result<StoredBroadcast | null>> {
  try {
    const [row] = await db.select().from(broadcasts).where(eq(broadcasts.id, id));
    return ok(row ?? null);
  } catch (error) {
    return fail("reading a broadcast", error);
  }
}

/** Every broadcast, newest first. */
export async function findBroadcasts(db: Queryable): Promise<Result<StoredBroadcast[]>> {
  try {
    return ok(await db.select().from(broadcasts).orderBy(desc(broadcasts.createdAt), desc(broadcasts.id)));
  } catch (error) {
    return fail("listing broadcasts", error);
  }
}

/** The sends of one broadcast, or of every broadcast when `broadcastId` is null, by project. */
export async function findSends(db: Queryable, broadcastId: string | null): Promise<Result<StoredSend[]>> {
  try {
    const query = db.select().from(broadcastSends);
    const rows = await (broadcastId === null ? query : query.where(eq(broadcastSends.broadcastId, broadcastId))).orderBy(
      asc(broadcastSends.repositoryKey),
    );
    return ok(rows.map(toStoredSend));
  } catch (error) {
    return fail("listing broadcast sends", error);
  }
}

/** Claims the send of a broadcast to one project; when a send exists, returns it instead. */
export async function claimSend(db: Queryable, send: NewSend): Promise<Result<SendClaim>> {
  try {
    const inserted = await db.execute<{ id: number }>(sql`
      insert into projects.broadcast_sends (broadcast_id, repository_key, full_name, status, updated_at)
      values (${send.broadcastId}, ${send.repositoryKey}, ${send.fullName}, 'creating', ${send.at})
      on conflict (broadcast_id, repository_key) do nothing
      returning id`);
    const id = inserted.rows[0]?.id;
    if (id !== undefined) {
      return ok({ kind: "claimed", id: Number(id) });
    }
    const [row] = await db
      .select()
      .from(broadcastSends)
      .where(and(eq(broadcastSends.broadcastId, send.broadcastId), eq(broadcastSends.repositoryKey, send.repositoryKey)));
    if (row === undefined) {
      return fail("claiming a broadcast send", new Error("the competing send disappeared"));
    }
    return ok({ kind: "taken", existing: toStoredSend(row) });
  } catch (error) {
    return fail("claiming a broadcast send", error);
  }
}

/**
 * Takes over a failed send, or one left `creating` by a request that died, as it was read (`existing`): only one
 * caller can, because the update matches the row's status and its time.
 */
export async function takeOverSend(db: Queryable, existing: StoredSend, at: Date): Promise<Result<boolean>> {
  try {
    const updated = await db
      .update(broadcastSends)
      .set({ status: "creating", failure: null, failureToken: null, updatedAt: at })
      .where(
        and(
          eq(broadcastSends.id, existing.id),
          eq(broadcastSends.status, existing.status),
          eq(broadcastSends.updatedAt, existing.updatedAt),
        ),
      )
      .returning({ id: broadcastSends.id });
    return ok(updated.length === 1);
  } catch (error) {
    return fail("taking over a broadcast send", error);
  }
}

export async function markSendSent(
  db: Queryable,
  id: number,
  issue: { readonly number: number; readonly url: string },
  at: Date,
): Promise<Result<undefined>> {
  try {
    await db
      .update(broadcastSends)
      .set({ status: "sent", failure: null, failureToken: null, issueNumber: issue.number, issueUrl: issue.url, updatedAt: at })
      .where(and(eq(broadcastSends.id, id), eq(broadcastSends.status, "creating")));
    return ok();
  } catch (error) {
    return fail("recording a sent broadcast", error);
  }
}

export interface SendFailureRecord {
  /** The reason code. */
  readonly failure: string;
  /** The label of the refused token, or `null`. */
  readonly token: string | null;
  readonly at: Date;
}

export async function markSendFailed(db: Queryable, id: number, record: SendFailureRecord): Promise<Result<undefined>> {
  try {
    await db
      .update(broadcastSends)
      .set({ status: "failed", failure: record.failure, failureToken: record.token, updatedAt: record.at })
      .where(and(eq(broadcastSends.id, id), eq(broadcastSends.status, "creating")));
    return ok();
  } catch (error) {
    return fail("recording a failed broadcast send", error);
  }
}

const logger = createLogger("projects");

function fail(operation: string, error: unknown): Err<CoreErrorCode> {
  // The label names the error class and its safe code, never its text (a database error can hold the values).
  logger.error("storage call failed", { operation, error: errorLogLabel(error) });
  return safeError(error);
}
