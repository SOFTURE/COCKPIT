// The `owner/name` a person types for a watched repository, checked against the forge's naming rules.
import { err, ok, type Result } from "@softure-ai/core";

export interface RepositoryName {
  readonly owner: string;
  readonly name: string;
  /** `owner/name` as typed (trimmed); the forge treats names case-insensitively. */
  readonly fullName: string;
  /** The lower-cased `owner/name`: the key a repository is stored under. */
  readonly key: string;
}

// Owners: letters, digits and single hyphens, at most 39 characters. Names: letters, digits, `.`, `-`, `_`.
const OWNER_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;
const NAME_PATTERN = /^[A-Za-z0-9._-]{1,100}$/;

export function parseRepositoryName(input: string): Result<RepositoryName, "projects.name_invalid"> {
  const parts = input.trim().split("/");
  if (parts.length !== 2) {
    return err("projects.name_invalid");
  }
  const [owner = "", name = ""] = parts;
  if (!OWNER_PATTERN.test(owner) || !NAME_PATTERN.test(name) || name === "." || name === "..") {
    return err("projects.name_invalid");
  }
  const fullName = `${owner}/${name}`;
  return ok({ owner, name, fullName, key: fullName.toLowerCase() });
}
