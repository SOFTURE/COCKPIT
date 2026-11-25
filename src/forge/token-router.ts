// One forge client over several access tokens (F-6): a fine-grained token reads the repositories of one resource
// owner, so COCKPIT holds a client per token and reads each repository with the first token that can read it. A call
// goes to the token that last read the repository, else the token that last read one of its owner's repositories,
// else the tokens in order; an answer that says the token cannot see or may not use the repository (404, 401, 403)
// moves it to the next token and drops the pick and hint that led there. So the usual call costs no extra request, a
// token whose selection changed is found again by the next call, and an organisation that turns another owner's token
// away (403, even on its public repositories) is read with its own token (#85). Tokens never leave the inner clients;
// a refusal names its token by label.
import type {
  CreatedForgeIssue,
  ForgeBudget,
  ForgeClient,
  ForgeRead,
} from "./client.ts";

const REPOSITORY_PATH = /^\/repos\/([^/?#]+)\/([^/?#]+)(?:[/?#]|$)/;

/**
 * Failures after which a call tries the next token: this token does not see the repository or may not use it, and the
 * forge did nothing (a write that may have been taken, `unavailable` or `invalid_answer`, never moves on).
 */
const MOVE_ON = new Set(["refused", "not_found", "unauthorized"]);

/** Which token (by position) last read a repository of each owner; shared by the routers of one process. */
export type OwnerHints = Map<string, number>;

function repositoryKey(owner: string, name: string): string {
  return `${owner}/${name}`.toLowerCase();
}

/** The repository a path below the API root belongs to, or `null` for a path that names none (`/user/repos`). */
export function findPathRepository(
  path: string,
): { readonly owner: string; readonly name: string } | null {
  const match = REPOSITORY_PATH.exec(path);
  if (match === null) {
    return null;
  }
  return {
    owner: decodeURIComponent(match[1] ?? ""),
    name: decodeURIComponent(match[2] ?? ""),
  };
}

/** The budget closest to running out among those the clients reported. */
function getLowestBudget(clients: readonly ForgeClient[]): ForgeBudget {
  let lowest: ForgeBudget = { remaining: null, resetAt: null };
  for (const client of clients) {
    const budget = client.getBudget();
    if (
      budget.remaining !== null &&
      (lowest.remaining === null || budget.remaining < lowest.remaining)
    ) {
      lowest = budget;
    }
  }
  return lowest;
}

/** The label of the token at `index` when the caller gave none: its position, counted from 1. */
function getDefaultLabel(index: number): string {
  return `token ${String(index + 1)}`;
}

/** The failure with the label of the token that gave it, for the failures a token's permissions explain. */
function labelFailure<T>(answer: ForgeRead<T>, label: string): ForgeRead<T> {
  if (answer.ok || (answer.kind !== "refused" && answer.kind !== "unauthorized")) {
    return answer;
  }
  return { ...answer, token: label };
}

/**
 * A client that routes each repository to the first of `clients` that reads it; the first client answers the rest.
 * `labels` name the tokens in failures (for example the environment names), by position.
 */
export function createTokenRouter(
  clients: readonly ForgeClient[],
  hints: OwnerHints = new Map(),
  labels: readonly string[] = [],
): ForgeClient {
  const primary = clients[0];
  if (primary === undefined) {
    throw new Error("createTokenRouter: at least one client is needed");
  }
  if (clients.length === 1) {
    return primary;
  }
  const first: ForgeClient = primary;
  /** The token that last read each repository during this router's life. */
  const picks = new Map<string, number>();

  function getOrder(owner: string, name: string): number[] {
    const preferred =
      picks.get(repositoryKey(owner, name)) ?? hints.get(owner.toLowerCase());
    const order = clients.map((_, index) => index);
    return preferred === undefined
      ? order
      : [preferred, ...order.filter((index) => index !== preferred)];
  }

  function remember(owner: string, name: string, index: number) {
    picks.set(repositoryKey(owner, name), index);
    hints.set(owner.toLowerCase(), index);
  }

  /** Drops the pick and the owner hint that sent a call to a token that could not serve it. */
  function forget(owner: string, name: string, index: number) {
    const key = repositoryKey(owner, name);
    if (picks.get(key) === index) {
      picks.delete(key);
    }
    if (hints.get(owner.toLowerCase()) === index) {
      hints.delete(owner.toLowerCase());
    }
  }

  async function onRepository<T>(
    owner: string,
    name: string,
    call: (client: ForgeClient) => Promise<ForgeRead<T>>,
  ): Promise<ForgeRead<T>> {
    let firstFailure: ForgeRead<T> | null = null;
    let firstRefusal: ForgeRead<T> | null = null;
    for (const index of getOrder(owner, name)) {
      const answer = labelFailure(
        await call(clients[index] as ForgeClient),
        labels[index] ?? getDefaultLabel(index),
      );
      if (answer.ok) {
        remember(owner, name, index);
        return answer;
      }
      if (!MOVE_ON.has(answer.kind)) {
        return answer;
      }
      forget(owner, name, index);
      firstFailure ??= answer;
      if (answer.kind === "refused") {
        firstRefusal ??= answer;
      }
    }
    // Every token was asked (`clients` is not empty, so there is a failure). A refusal says more than a 404: that
    // token sees the repository but lacks a permission, and the token that read the repository is asked first.
    return firstRefusal ?? firstFailure ?? { ok: false, kind: "not_found" };
  }

  async function onPath<T>(
    path: string,
    call: (client: ForgeClient) => Promise<ForgeRead<T>>,
  ): Promise<ForgeRead<T>> {
    const repository = findPathRepository(path);
    return repository === null
      ? call(first)
      : onRepository(repository.owner, repository.name, call);
  }

  return {
    getRepository: (owner, name) =>
      onRepository(owner, name, (client) => client.getRepository(owner, name)),
    probe: (path) => onPath(path, (client) => client.probe(path)),
    getJson: (path, schema) =>
      onPath(path, (client) => client.getJson(path, schema)),
    getJsonFile: (owner, name, path, ref) =>
      onRepository(owner, name, (client) =>
        client.getJsonFile(owner, name, path, ref),
      ),
    listCockpitIssues: (owner, name) =>
      onRepository(owner, name, (client) =>
        client.listCockpitIssues(owner, name),
      ),
    hasLabel: async (owner, name, label) => {
      // A token that cannot see the repository answers 404 for its label too, which reads as "no label": the
      // repository's token is found first.
      if (!picks.has(repositoryKey(owner, name))) {
        const found = await onRepository(owner, name, (client) =>
          client.getRepository(owner, name),
        );
        if (!found.ok) {
          return found;
        }
      }
      // The repository's token is asked first; a token that may not read labels moves the call on.
      return onRepository(owner, name, (client) =>
        client.hasLabel(owner, name, label),
      );
    },
    // A public repository of another owner is readable by the first token, but only its owner's token may write.
    createIssue: (owner, name, issue): Promise<ForgeRead<CreatedForgeIssue>> =>
      onRepository(owner, name, (client) =>
        client.createIssue(owner, name, issue),
      ),
    getBudget: () => getLowestBudget(clients),
  };
}
