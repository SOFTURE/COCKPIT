// The owner's answers (FR-5, FR-6). An answer is claimed before the forge call; the unique index on the project, the
// entry id and the entry text lets exactly one claim of the same entry text win, however many arrive at once.
import { errorLogLabel, ok, safeError, type CoreErrorCode, type Err, type Result } from "@softure-ai/core";
import type { Queryable } from "@softure-ai/db";
import { and, asc, eq, lt, sql } from "drizzle-orm";
import { answers } from "./schema.ts";

export type AnswerValue = "yes" | "no" | "later";
export type AnswerStatus = "creating" | "sent";
export type EntryKind = "word" | "decision" | "step" | "secret";

export interface StoredAnswer {
  readonly id: number;
  readonly repositoryKey: string;
  readonly fullName: string;
  readonly entryId: string;
  readonly entryText: string;
  readonly entryKind: EntryKind;
  readonly entrySource: string;
  readonly entryItem: string | null;
  readonly answer: AnswerValue;
  readonly note: string | null;
  readonly answeredBy: string;
  readonly answeredAt: Date;
  readonly status: AnswerStatus;
  readonly issueNumber: number | null;
  readonly issueUrl: string | null;
}

export type NewAnswer = Omit<StoredAnswer, "id" | "status" | "issueNumber" | "issueUrl">;

export type ClaimOutcome = { readonly kind: "claimed"; readonly id: number } | { readonly kind: "taken"; readonly existing: StoredAnswer };

function toStoredAnswer(row: typeof answers.$inferSelect): StoredAnswer {
  return {
    id: row.id,
    repositoryKey: row.repositoryKey,
    fullName: row.fullName,
    entryId: row.entryId,
    entryText: row.entryText,
    // The table's checks hold these to their sets.
    entryKind: row.entryKind as EntryKind,
    entrySource: row.entrySource,
    entryItem: row.entryItem,
    answer: row.answer as AnswerValue,
    note: row.note,
    answeredBy: row.answeredBy,
    answeredAt: row.answeredAt,
    status: row.status as AnswerStatus,
    issueNumber: row.issueNumber,
    issueUrl: row.issueUrl,
  };
}

/** Claims the answer of one entry text; when another answer holds it, returns that one instead. */
export async function claimAnswer(db: Queryable, answer: NewAnswer): Promise<Result<ClaimOutcome>> {
  try {
    const inserted = await db.execute<{ id: number }>(sql`
      insert into projects.answers (
        repository_key, full_name, entry_id, entry_text, entry_kind, entry_source, entry_item,
        answer, note, answered_by, answered_at, status
      ) values (
        ${answer.repositoryKey}, ${answer.fullName}, ${answer.entryId}, ${answer.entryText}, ${answer.entryKind},
        ${answer.entrySource}, ${answer.entryItem}, ${answer.answer}, ${answer.note}, ${answer.answeredBy},
        ${answer.answeredAt}, 'creating'
      )
      on conflict (repository_key, entry_id, md5(entry_text)) do nothing
      returning id`);
    const id = inserted.rows[0]?.id;
    if (id !== undefined) {
      return ok({ kind: "claimed", id: Number(id) });
    }
    const [row] = await db
      .select()
      .from(answers)
      .where(
        and(
          eq(answers.repositoryKey, answer.repositoryKey),
          eq(answers.entryId, answer.entryId),
          sql`md5(${answers.entryText}) = md5(${answer.entryText})`,
        ),
      );
    if (row === undefined) {
      // The holder was released between the insert and the read: the caller may try again.
      return fail("claiming an answer", new Error("the competing answer was released"));
    }
    return ok({ kind: "taken", existing: toStoredAnswer(row) });
  } catch (error) {
    return fail("claiming an answer", error);
  }
}

/**
 * Takes over a claim that has stayed `creating` since before `staleBefore` (a request that died mid-way), with the
 * new answer's values. Returns whether this caller now holds it; only one caller can.
 */
export async function takeOverStaleClaim(db: Queryable, id: number, staleBefore: Date, answer: NewAnswer): Promise<Result<boolean>> {
  try {
    const updated = await db
      .update(answers)
      .set({ answer: answer.answer, note: answer.note, answeredBy: answer.answeredBy, answeredAt: answer.answeredAt })
      .where(and(eq(answers.id, id), eq(answers.status, "creating"), lt(answers.answeredAt, staleBefore)))
      .returning({ id: answers.id });
    return ok(updated.length === 1);
  } catch (error) {
    return fail("taking over a stale answer", error);
  }
}

export async function markAnswerSent(db: Queryable, id: number, issue: { readonly number: number; readonly url: string }): Promise<Result<undefined>> {
  try {
    await db
      .update(answers)
      .set({ status: "sent", issueNumber: issue.number, issueUrl: issue.url })
      .where(and(eq(answers.id, id), eq(answers.status, "creating")));
    return ok();
  } catch (error) {
    return fail("recording a sent answer", error);
  }
}

/** Drops a claim whose issue was not created, so the entry stays unanswered. */
export async function releaseAnswer(db: Queryable, id: number): Promise<Result<undefined>> {
  try {
    await db.delete(answers).where(and(eq(answers.id, id), eq(answers.status, "creating")));
    return ok();
  } catch (error) {
    return fail("releasing an answer", error);
  }
}

export async function findAnswers(db: Queryable): Promise<Result<StoredAnswer[]>> {
  try {
    const rows = await db.select().from(answers).orderBy(asc(answers.answeredAt), asc(answers.id));
    return ok(rows.map(toStoredAnswer));
  } catch (error) {
    return fail("listing answers", error);
  }
}

function fail(operation: string, error: unknown): Err<CoreErrorCode> {
  console.error(`projects: ${operation} failed: ${errorLogLabel(error)}`);
  return safeError(error);
}
