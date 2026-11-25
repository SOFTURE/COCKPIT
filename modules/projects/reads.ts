// The scan's reads of watched projects: one row per project, the latest status and the last good content.
import { errorLogLabel, ok, safeError, type CoreErrorCode, type Err, type Result } from "@softure-ai/core";
import { createLogger } from "@softure-ai/observability";
import type { Queryable } from "@softure-ai/db";
import { eq, sql } from "drizzle-orm";
import { reads, repositories } from "./schema.ts";

export const READ_STATUSES = ["ok", "no_state", "state_too_old", "state_invalid", "not_readable", "unavailable"] as const;
export type ReadStatus = (typeof READ_STATUSES)[number];
export type IssuesStatus = "ok" | "not_readable" | "unavailable";

export interface ProjectRead {
  readonly key: string;
  readonly status: ReadStatus;
  readonly issuesStatus: IssuesStatus;
  /** The last good `context/state.json` (version 2), kept when a later read fails. */
  readonly state: unknown;
  /** The last good list of owner-word issues. */
  readonly issues: unknown;
  readonly readAt: Date;
  readonly lastGoodAt: Date | null;
}

export interface RecordReadInput {
  readonly key: string;
  readonly status: ReadStatus;
  readonly issuesStatus: IssuesStatus;
  /** Set when the state was read and valid; `undefined` keeps the last good one. */
  readonly state?: unknown;
  /** Set when the issues were read; `undefined` keeps the last good ones. */
  readonly issues?: readonly unknown[];
  readonly readAt: Date;
}

/** Writes one project's read; the last good state and issues stay when this read did not get them. */
export async function recordRead(db: Queryable, input: RecordReadInput): Promise<Result<undefined>> {
  const hasState = input.state !== undefined;
  const stateJson = hasState ? JSON.stringify(input.state) : null;
  const issuesJson = input.issues === undefined ? null : JSON.stringify(input.issues);
  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql`
        insert into projects.reads (repository_key, status, issues_status, state, issues, read_at, last_good_at)
        values (
          ${input.key}, ${input.status}, ${input.issuesStatus}, ${stateJson}::jsonb,
          coalesce(${issuesJson}::jsonb, '[]'::jsonb), ${input.readAt}, ${hasState ? input.readAt : null}
        )
        on conflict (repository_key) do update set
          status = excluded.status,
          issues_status = excluded.issues_status,
          state = coalesce(${stateJson}::jsonb, projects.reads.state),
          issues = coalesce(${issuesJson}::jsonb, projects.reads.issues),
          read_at = excluded.read_at,
          last_good_at = coalesce(excluded.last_good_at, projects.reads.last_good_at)`);
      if (input.status === "ok" || input.status === "no_state") {
        await tx
          .update(repositories)
          .set({ hasState: input.status === "ok", checkedAt: input.readAt })
          .where(eq(repositories.repositoryKey, input.key));
      }
    });
    return ok();
  } catch (error) {
    return fail("recording a scan read", error);
  }
}

export async function findReads(db: Queryable): Promise<Result<ProjectRead[]>> {
  try {
    const rows = await db.select().from(reads);
    return ok(
      rows.map((row) => ({
        key: row.repositoryKey,
        status: row.status as ReadStatus,
        issuesStatus: row.issuesStatus as IssuesStatus,
        state: row.state,
        issues: row.issues,
        readAt: row.readAt,
        lastGoodAt: row.lastGoodAt,
      })),
    );
  } catch (error) {
    return fail("listing scan reads", error);
  }
}

const logger = createLogger("projects");

function fail(operation: string, error: unknown): Err<CoreErrorCode> {
  // The label names the error class and its safe code, never its text (a database error can hold the values).
  logger.error("storage call failed", { operation, error: errorLogLabel(error) });
  return safeError(error);
}
