// Project groups (CT-30): the named groups the owner orders the watched projects into, and which group a project is in.
// The database's constraints decide duplicates and unknown groups; they come back as codes, never as SQL.
import { err, errorLogLabel, ok, safeError, type CoreErrorCode, type Err, type Result } from "@softure-ai/core";
import { createLogger } from "@softure-ai/observability";
import type { Queryable } from "@softure-ai/db";
import { count, eq } from "drizzle-orm";
import { getConstraintName, hasPostgresCode } from "./queries.ts";
import { projectGroups, repositories } from "./schema.ts";

export interface ProjectGroup {
  readonly id: number;
  readonly name: string;
  /** The lower-case forge owner whose repositories, added later, join this group; null when none. */
  readonly defaultOwner: string | null;
}

export interface ProjectGroupWithCount extends ProjectGroup {
  readonly projectCount: number;
}

export interface ProjectGroupInput {
  readonly name: string;
  readonly defaultOwner: string | null;
}

export type ProjectGroupError =
  | "projects.group_name_taken"
  | "projects.group_owner_taken"
  | "projects.group_not_found"
  | CoreErrorCode;

export type SetRepositoryGroupError = "projects.group_not_found" | "projects.repository_not_found" | CoreErrorCode;

const UNIQUE_VIOLATION = "23505";
const FOREIGN_KEY_VIOLATION = "23503";
const NAME_UNIQUE = "project_groups_name_unique";
const OWNER_UNIQUE = "project_groups_default_owner_unique";

const COLUMNS = { id: projectGroups.id, name: projectGroups.name, defaultOwner: projectGroups.defaultOwner };

/** Every group with how many watched projects it holds; unordered (the screens order by the locale's collation). */
export async function findProjectGroups(db: Queryable): Promise<Result<ProjectGroupWithCount[]>> {
  try {
    const rows = await db
      .select({ ...COLUMNS, projectCount: count(repositories.id) })
      .from(projectGroups)
      .leftJoin(repositories, eq(repositories.groupId, projectGroups.id))
      .groupBy(projectGroups.id);
    return ok(rows.map((row) => ({ ...row, projectCount: Number(row.projectCount) })));
  } catch (error) {
    return fail("listing project groups", error);
  }
}

export async function insertProjectGroup(db: Queryable, input: ProjectGroupInput): Promise<Result<ProjectGroup, ProjectGroupError>> {
  try {
    const [row] = await db.insert(projectGroups).values({ name: input.name, defaultOwner: input.defaultOwner }).returning(COLUMNS);
    return row === undefined ? fail("adding a project group", new Error("no row returned")) : ok(row);
  } catch (error) {
    return failOnDuplicate("adding a project group", error);
  }
}

export async function renameProjectGroup(
  db: Queryable,
  id: number,
  input: ProjectGroupInput,
): Promise<Result<ProjectGroup, ProjectGroupError>> {
  try {
    const [row] = await db
      .update(projectGroups)
      .set({ name: input.name, defaultOwner: input.defaultOwner })
      .where(eq(projectGroups.id, id))
      .returning(COLUMNS);
    return row === undefined ? err("projects.group_not_found") : ok(row);
  } catch (error) {
    return failOnDuplicate("renaming a project group", error);
  }
}

/** Deletes the group; its projects fall to "No group" (the foreign key sets them null). */
export async function deleteProjectGroup(db: Queryable, id: number): Promise<Result<ProjectGroup, ProjectGroupError>> {
  try {
    const [row] = await db.delete(projectGroups).where(eq(projectGroups.id, id)).returning(COLUMNS);
    return row === undefined ? err("projects.group_not_found") : ok(row);
  } catch (error) {
    return fail("deleting a project group", error);
  }
}

/** Puts a watched repository into a group, or into "No group" with null. */
export async function setRepositoryGroup(
  db: Queryable,
  repositoryKey: string,
  groupId: number | null,
): Promise<Result<void, SetRepositoryGroupError>> {
  try {
    const rows = await db
      .update(repositories)
      .set({ groupId })
      .where(eq(repositories.repositoryKey, repositoryKey))
      .returning({ id: repositories.id });
    return rows.length === 0 ? err("projects.repository_not_found") : ok(undefined);
  } catch (error) {
    if (hasPostgresCode(error, FOREIGN_KEY_VIOLATION)) {
      return err("projects.group_not_found");
    }
    return fail("setting a repository's group", error);
  }
}

function failOnDuplicate(operation: string, error: unknown): Err<ProjectGroupError> {
  if (hasPostgresCode(error, UNIQUE_VIOLATION)) {
    const constraint = getConstraintName(error);
    if (constraint === NAME_UNIQUE) {
      return err("projects.group_name_taken");
    }
    if (constraint === OWNER_UNIQUE) {
      return err("projects.group_owner_taken");
    }
  }
  return fail(operation, error);
}

const logger = createLogger("projects");

function fail(operation: string, error: unknown): Err<CoreErrorCode> {
  // The label names the error class and its safe code, never its text (a database error can hold the values).
  logger.error("storage call failed", { operation, error: errorLogLabel(error) });
  return safeError(error);
}
