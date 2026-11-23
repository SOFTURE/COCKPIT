// The digest log (FR-12): the latest row is the last digest a run compares with; a pending row is a rendered mail
// still being sent. The partial unique index lets one run at a time hold a pending row.
import { errorLogLabel, err, ok, safeError, type CoreErrorCode, type Err, type Result } from "@softure-ai/core";
import type { Queryable } from "@softure-ai/db";
import { and, desc, eq } from "drizzle-orm";
import { digests } from "./schema.ts";

export type DigestStatus = "baseline" | "quiet" | "pending" | "sent";

export interface DigestMail {
  readonly subject: string;
  readonly text: string;
  readonly html: string;
}

export interface StoredDigest {
  readonly id: number;
  readonly status: DigestStatus;
  /** The snapshot the run compared; read defensively (`src/digest/build-snapshot.ts`). */
  readonly snapshot: unknown;
  /** Present exactly on pending and sent rows. */
  readonly mail: DigestMail | null;
  readonly createdAt: Date;
  readonly sentAt: Date | null;
}

export type NewDigest =
  | { readonly status: "baseline" | "quiet"; readonly snapshot: unknown; readonly createdAt: Date }
  | { readonly status: "pending"; readonly snapshot: unknown; readonly mail: DigestMail; readonly createdAt: Date };

function toStoredDigest(row: typeof digests.$inferSelect): StoredDigest {
  const hasMail = row.subject !== null && row.bodyText !== null && row.bodyHtml !== null;
  return {
    id: row.id,
    // The table's check holds the status to its set.
    status: row.status as DigestStatus,
    snapshot: row.snapshot,
    mail: hasMail ? { subject: row.subject ?? "", text: row.bodyText ?? "", html: row.bodyHtml ?? "" } : null,
    createdAt: row.createdAt,
    sentAt: row.sentAt,
  };
}

/** The newest digest row, whatever its status; null before the first digest run. */
export async function findLatestDigest(db: Queryable): Promise<Result<StoredDigest | null>> {
  try {
    const rows = await db.select().from(digests).orderBy(desc(digests.id)).limit(1);
    const [row] = rows;
    return ok(row === undefined ? null : toStoredDigest(row));
  } catch (error) {
    return fail("reading the latest digest", error);
  }
}

/** The digest whose mail is still being sent, if any. */
export async function findPendingDigest(db: Queryable): Promise<Result<StoredDigest | null>> {
  try {
    const rows = await db.select().from(digests).where(eq(digests.status, "pending")).limit(1);
    const [row] = rows;
    return ok(row === undefined ? null : toStoredDigest(row));
  } catch (error) {
    return fail("reading the pending digest", error);
  }
}

/** Records one digest run; a second pending row while one is pending is refused as `digest.pending_exists`. */
export async function insertDigest(db: Queryable, digest: NewDigest): Promise<Result<StoredDigest, CoreErrorCode | "digest.pending_exists">> {
  const mail = digest.status === "pending" ? digest.mail : null;
  try {
    const rows = await db
      .insert(digests)
      .values({
        status: digest.status,
        snapshot: digest.snapshot,
        subject: mail?.subject ?? null,
        bodyText: mail?.text ?? null,
        bodyHtml: mail?.html ?? null,
        createdAt: digest.createdAt,
      })
      .onConflictDoNothing()
      .returning();
    const [row] = rows;
    return row === undefined ? err("digest.pending_exists") : ok(toStoredDigest(row));
  } catch (error) {
    return fail("recording a digest", error);
  }
}

/** Marks a pending digest sent; false when it was not pending. */
export async function markDigestSent(db: Queryable, id: number, sentAt: Date): Promise<Result<boolean>> {
  try {
    const rows = await db
      .update(digests)
      .set({ status: "sent", sentAt })
      .where(and(eq(digests.id, id), eq(digests.status, "pending")))
      .returning({ id: digests.id });
    return ok(rows.length === 1);
  } catch (error) {
    return fail("marking a digest sent", error);
  }
}

function fail(operation: string, error: unknown): Err<CoreErrorCode> {
  console.error(`digest: ${operation} failed: ${errorLogLabel(error)}`);
  return safeError(error);
}
