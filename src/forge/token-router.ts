// One forge client over several access tokens (F-6): a fine-grained token reads the repositories of one resource
// owner, so COCKPIT holds a client per token and reads each repository with the first token that can read it. A call
// goes to the token that last read the repository, else the token that last read one of its owner's repositories,
// else the tokens in order; an answer that says the token cannot see the repository moves it to the next token. So
// the usual call costs no extra request, and a token whose selection changed is found again by the next call. Tokens
// never leave the inner clients.
import type {
  CreatedForgeIssue,
  ForgeBudget,
  ForgeClient,
  ForgeRead,
} from "./client.ts";

const REPOSITORY_PATH = /^\/repos\/([^/?#]+)\/([^/?#]+)(?:[/?#]|$)/;

/** Failures after which a read tries the next token: this token does not see the repository. */
const READ_MOVE_ON = new Set(["not_found", "unauthorized"]);
/** Failures after which a write tries the next token: the forge created nothing. */
const WRITE_MOVE_ON = new Set(["refused", "not_found", "unauthorized"]);

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

/** A client that routes each repository to the first of `clients` that reads it; the first client answers the rest. */
export function createTokenRouter(
  clients: readonly ForgeClient[],
  hints: OwnerHints = new Map(),
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

  async function onRepository<T>(
    owner: string,
    name: string,
    call: (client: ForgeClient) => Promise<ForgeRead<T>>,
    moveOn: ReadonlySet<string> = READ_MOVE_ON,
  ): Promise<ForgeRead<T>> {
    let firstFailure: ForgeRead<T> | null = null;
    for (const index of getOrder(owner, name)) {
      const answer = await call(clients[index] as ForgeClient);
      if (answer.ok) {
        remember(owner, name, index);
        return answer;
      }
      if (!moveOn.has(answer.kind)) {
        return answer;
      }
      firstFailure ??= answer;
    }
    // Every token was asked (`clients` is not empty, so there is a failure).
    return firstFailure ?? { ok: false, kind: "not_found" };
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
    listOwnerWordIssues: (owner, name) =>
      onRepository(owner, name, (client) =>
        client.listOwnerWordIssues(owner, name),
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
      const index = picks.get(repositoryKey(owner, name)) ?? 0;
      return (clients[index] as ForgeClient).hasLabel(owner, name, label);
    },
    // A public repository of another owner is readable by the first token, but only its owner's token may write.
    createIssue: (owner, name, issue): Promise<ForgeRead<CreatedForgeIssue>> =>
      onRepository(
        owner,
        name,
        (client) => client.createIssue(owner, name, issue),
        WRITE_MOVE_ON,
      ),
    getBudget: () => getLowestBudget(clients),
  };
}
