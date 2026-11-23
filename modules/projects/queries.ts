// Reads and writes of the watched repositories. Failures come back as codes, never as SQL.
import { err, errorLogLabel, ok, safeError, type CoreErrorCode, type Err, type Result } from "@softure-ai/core";
import type { Queryable } from "@softure-ai/db";
import { asc, eq } from "drizzle-orm";
import { repositories } from "./schema.ts";

export interface WatchedRepository {
  readonly id: number;
  readonly key: string;
  readonly fullName: string;
  readonly defaultBranch: string;
  readonly hasState: boolean;
  readonly missingPermissions: readonly string[];
  readonly checkedAt: Date;
}

export interface NewWatchedRepository {
  readonly key: string;
  readonly fullName: string;
  readonly defaultBranch: string;
  readonly hasState: boolean;
  readonly missingPermissions: readonly string[];
  readonly checkedAt: Date;
}

const UNIQUE_VIOLATION = "23505";

const COLUMNS = {
  id: repositories.id,
  key: repositories.repositoryKey,
  fullName: repositories.fullName,
  defaultBranch: repositories.defaultBranch,
  hasState: repositories.hasState,
  missingPermissions: repositories.missingPermissions,
  checkedAt: repositories.checkedAt,
};

export async function findRepositories(db: Queryable): Promise<Result<WatchedRepository[]>> {
  try {
    return ok(await db.select(COLUMNS).from(repositories).orderBy(asc(repositories.repositoryKey)));
  } catch (error) {
    return fail("listing watched repositories", error);
  }
}

export async function insertRepository(
  db: Queryable,
  repository: NewWatchedRepository,
): Promise<Result<WatchedRepository, CoreErrorCode | "projects.already_watched">> {
  try {
    const [row] = await db
      .insert(repositories)
      .values({
        repositoryKey: repository.key,
        fullName: repository.fullName,
        defaultBranch: repository.defaultBranch,
        hasState: repository.hasState,
        missingPermissions: [...repository.missingPermissions],
        checkedAt: repository.checkedAt,
      })
      .onConflictDoNothing({ target: repositories.repositoryKey })
      .returning(COLUMNS);
    return row === undefined ? err("projects.already_watched") : ok(row);
  } catch (error) {
    if (hasPostgresCode(error, UNIQUE_VIOLATION)) {
      return err("projects.already_watched");
    }
    return fail("adding a watched repository", error);
  }
}

/** Deletes the repository; answers whether a row was there. */
export async function deleteRepository(db: Queryable, key: string): Promise<Result<boolean>> {
  try {
    const rows = await db.delete(repositories).where(eq(repositories.repositoryKey, key)).returning({ id: repositories.id });
    return ok(rows.length > 0);
  } catch (error) {
    return fail("removing a watched repository", error);
  }
}

function hasPostgresCode(error: unknown, code: string): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 3 && typeof current === "object" && current !== null; depth += 1) {
    if ("code" in current && current.code === code) {
      return true;
    }
    current = "cause" in current ? current.cause : undefined;
  }
  return false;
}

function fail(operation: string, error: unknown): Err<CoreErrorCode> {
  console.error(`projects: ${operation} failed: ${errorLogLabel(error)}`);
  return safeError(error);
}
