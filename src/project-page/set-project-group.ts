// Puts a watched project into one of the owner's groups, or into No group, from the project's Settings tab (CT-31).
// The signed-in check runs first and the database is reached only after it; the group id is narrowed with zod, and a
// group that no longer exists comes back as a value, never as an exception.
import type { Queryable } from "@softure-ai/db";
import { setRepositoryGroup } from "../../modules/projects/groups.ts";
import { parseGroupId } from "../projects/project-group-input.ts";

export interface SetProjectGroupDependencies {
  /** Resolves the signed-in user; throws (redirects) when nobody is signed in. */
  readonly requireUser: () => Promise<{ readonly id: string }>;
  readonly getDb: () => Promise<Queryable>;
}

export type SetProjectGroupFailure = "invalid" | "not_found" | "unexpected";

export type SetProjectGroupOutcome =
  | { readonly ok: true; readonly userId: string; readonly repositoryKey: string; readonly groupId: number | null }
  | { readonly ok: false; readonly userId: string; readonly error: SetProjectGroupFailure };

function readText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

/** `groupId` empty means No group; `repositoryKey` is the watched repository's key. */
export async function setProjectGroup(dependencies: SetProjectGroupDependencies, formData: FormData): Promise<SetProjectGroupOutcome> {
  const user = await dependencies.requireUser();
  const repositoryKey = readText(formData, "repositoryKey").trim().toLowerCase();
  const rawGroupId = readText(formData, "groupId");
  const groupId = rawGroupId === "" ? null : parseGroupId(formData);
  if (repositoryKey === "" || (rawGroupId !== "" && groupId === null)) {
    return { ok: false, userId: user.id, error: "invalid" };
  }
  const db = await dependencies.getDb();
  const set = await setRepositoryGroup(db, repositoryKey, groupId);
  if (!set.ok) {
    return { ok: false, userId: user.id, error: set.error === "projects.group_not_found" || set.error === "projects.repository_not_found" ? "not_found" : "unexpected" };
  }
  return { ok: true, userId: user.id, repositoryKey, groupId };
}
