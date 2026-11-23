// The owner-facing words for a watched repository's access: its status, its missing permissions, its errors.
import type { AppMessages } from "../../messages/index.ts";
import { isForgePermission, type ForgePermission } from "../forge/permissions.ts";
import type { AddRepositoryError } from "./add-repository.ts";

type RepositoryCopy = AppMessages["repositories"];

export type RepositoryAccessStatus = "readable" | "no_state" | "missing_permissions";

export function getRepositoryAccessStatus(repository: { readonly hasState: boolean; readonly missingPermissions: readonly string[] }): RepositoryAccessStatus {
  if (repository.missingPermissions.length > 0) {
    return "missing_permissions";
  }
  return repository.hasState ? "readable" : "no_state";
}

export function describePermissions(copy: RepositoryCopy, permissions: readonly string[]): string {
  return permissions
    .filter((permission): permission is ForgePermission => isForgePermission(permission))
    .map((permission) => copy.permissions[permission])
    .join(", ");
}

export function describeErrorCode(copy: RepositoryCopy, error: AddRepositoryError): string {
  return error in copy.errors ? copy.errors[error as keyof RepositoryCopy["errors"]] : copy.errors.unexpected;
}
