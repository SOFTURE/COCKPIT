// Which of the read permissions COCKPIT needs (NFR-5) the configured forge access grants on one repository.
// Every probe is a GET: checking access never changes the watched repository.
import type { ForgeClient, ForgeRead } from "./client.ts";
import type { RepositoryName } from "./repository-name.ts";

/** The fine-grained permissions COCKPIT reads with, by their forge key; their names live in the messages. */
export const FORGE_PERMISSIONS = ["metadata", "contents", "issues", "pull_requests", "actions"] as const;

export type ForgePermission = (typeof FORGE_PERMISSIONS)[number];

export function isForgePermission(value: string): value is ForgePermission {
  return (FORGE_PERMISSIONS as readonly string[]).includes(value);
}

export const STATE_FILE_PATH = "context/state.json";

export type RepositoryAccess =
  | {
      readonly kind: "readable";
      readonly fullName: string;
      readonly defaultBranch: string;
      readonly hasState: boolean;
      readonly missing: readonly ForgePermission[];
    }
  | { readonly kind: "unreadable"; readonly reason: "not_found" | "refused" | "unauthorized" | "unavailable"; readonly missing: readonly ForgePermission[] };

/** Reads `contents=read; pull_requests=read` into the permission keys COCKPIT knows, in header order. */
export function parseAcceptedPermissions(header: string | null): ForgePermission[] {
  if (header === null) {
    return [];
  }
  const found: ForgePermission[] = [];
  for (const part of header.split(/[;,]/)) {
    const key = part.split("=")[0]?.trim().toLowerCase() ?? "";
    if (isForgePermission(key) && !found.includes(key)) {
      found.push(key);
    }
  }
  return found;
}

function refusedPermissions(answer: ForgeRead<unknown>, probed: ForgePermission): ForgePermission[] {
  if (answer.ok || answer.kind !== "refused") {
    return [];
  }
  const named = parseAcceptedPermissions(answer.acceptedPermissions);
  return named.length > 0 ? named : [probed];
}

export async function checkRepositoryAccess(client: ForgeClient, repository: RepositoryName): Promise<RepositoryAccess> {
  const metadata = await client.getRepository(repository.owner, repository.name);
  if (!metadata.ok) {
    if (metadata.kind === "unavailable" || metadata.kind === "unauthorized") {
      return { kind: "unreadable", reason: metadata.kind, missing: [] };
    }
    // A repository outside the token's selection answers 404, like one that does not exist.
    const missing = metadata.kind === "not_found" ? ["metadata" as const] : refusedPermissions(metadata, "metadata");
    return { kind: "unreadable", reason: metadata.kind, missing };
  }

  const base = `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}`;
  const branch = encodeURIComponent(metadata.value.default_branch);
  const [state, pulls, issues, actions] = await Promise.all([
    client.probe(`${base}/contents/${STATE_FILE_PATH}?ref=${branch}`),
    client.probe(`${base}/pulls?per_page=1`),
    client.probe(`${base}/issues?per_page=1`),
    client.probe(`${base}/actions/runs?per_page=1`),
  ]);

  if (!state.ok && (state.kind === "unavailable" || state.kind === "unauthorized")) {
    return { kind: "unreadable", reason: state.kind, missing: [] };
  }
  const contentsMissing = refusedPermissions(state, "contents");
  if (contentsMissing.length > 0) {
    // Without Contents COCKPIT cannot read the state at all: the repository is not added.
    return { kind: "unreadable", reason: "refused", missing: contentsMissing };
  }

  const missing = new Set<ForgePermission>([
    ...refusedPermissions(pulls, "pull_requests"),
    ...refusedPermissions(issues, "issues"),
    ...refusedPermissions(actions, "actions"),
  ]);
  return {
    kind: "readable",
    fullName: metadata.value.full_name,
    defaultBranch: metadata.value.default_branch,
    hasState: state.ok,
    missing: [...missing],
  };
}
