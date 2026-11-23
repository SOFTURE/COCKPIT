// Adding and removing a watched repository (FR-2): the name is checked, the forge access is probed, then the row is
// written. A repository COCKPIT cannot read is not added, and the permission it lacks is named.
import type { Clock, CoreErrorCode } from "@softure-ai/core";
import type { Queryable } from "@softure-ai/db";
import { deleteRepository, insertRepository, type WatchedRepository } from "../../modules/projects/queries.ts";
import type { ForgeClient } from "../forge/client.ts";
import { checkRepositoryAccess, type ForgePermission } from "../forge/permissions.ts";
import { parseRepositoryName } from "../forge/repository-name.ts";

export type AddRepositoryError =
  | "projects.name_invalid"
  | "projects.already_watched"
  | "projects.forge_not_configured"
  | "projects.token_refused"
  | "projects.forge_unavailable"
  | "projects.not_readable"
  | CoreErrorCode;

export type AddRepositoryResult =
  | { readonly ok: true; readonly value: WatchedRepository }
  | { readonly ok: false; readonly error: AddRepositoryError; readonly missing: readonly ForgePermission[] };

export interface AddRepositoryOptions {
  readonly db: Queryable;
  readonly client: ForgeClient | null;
  readonly clock: Clock;
  readonly input: string;
}

function failure(error: AddRepositoryError, missing: readonly ForgePermission[] = []): AddRepositoryResult {
  return { ok: false, error, missing };
}

export async function addRepository({ db, client, clock, input }: AddRepositoryOptions): Promise<AddRepositoryResult> {
  const name = parseRepositoryName(input);
  if (!name.ok) {
    return failure(name.error);
  }
  if (client === null) {
    return failure("projects.forge_not_configured");
  }
  const access = await checkRepositoryAccess(client, name.value);
  if (access.kind === "unreadable") {
    if (access.reason === "unauthorized") {
      return failure("projects.token_refused");
    }
    if (access.reason === "unavailable") {
      return failure("projects.forge_unavailable");
    }
    return failure("projects.not_readable", access.missing);
  }
  const inserted = await insertRepository(db, {
    key: name.value.key,
    fullName: access.fullName,
    defaultBranch: access.defaultBranch,
    hasState: access.hasState,
    missingPermissions: access.missing,
    checkedAt: clock.now(),
  });
  return inserted.ok ? inserted : failure(inserted.error);
}

export async function removeRepository(db: Queryable, input: string) {
  const name = parseRepositoryName(input);
  if (!name.ok) {
    return name;
  }
  return deleteRepository(db, name.value.key);
}
