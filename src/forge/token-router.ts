// One forge client over several access tokens (F-6): a fine-grained token reads the repositories of one resource
// owner, so COCKPIT holds a client per token and reads each repository with the first token that can read it. The
// pick is made per repository by reading its metadata and kept for the router's lifetime (one scan run, one request),
// so a token whose selection changed is picked again by the next router. Tokens never leave the inner clients.
import type { CreatedForgeIssue, ForgeBudget, ForgeClient, ForgeRead, ForgeRepository } from "./client.ts";

const REPOSITORY_PATH = /^\/repos\/([^/?#]+)\/([^/?#]+)(?:[/?#]|$)/;

/** Failures after which a write tries the next token: the forge created nothing. */
const WRITE_RETRY_KINDS = new Set(["refused", "not_found", "unauthorized"]);

type Pick = { readonly ok: true; readonly client: ForgeClient; readonly repository: ForgeRepository } | ({ readonly ok: false } & Exclude<ForgeRead<ForgeRepository>, { ok: true }>);

function repositoryKey(owner: string, name: string): string {
  return `${owner}/${name}`.toLowerCase();
}

/** The repository a path below the API root belongs to, or `null` for a path that names none (`/user/repos`). */
export function findPathRepository(path: string): { readonly owner: string; readonly name: string } | null {
  const match = REPOSITORY_PATH.exec(path);
  if (match === null) {
    return null;
  }
  return { owner: decodeURIComponent(match[1] ?? ""), name: decodeURIComponent(match[2] ?? "") };
}

/** The budget closest to running out among those the clients reported. */
function getLowestBudget(clients: readonly ForgeClient[]): ForgeBudget {
  let lowest: ForgeBudget = { remaining: null, resetAt: null };
  for (const client of clients) {
    const budget = client.getBudget();
    if (budget.remaining !== null && (lowest.remaining === null || budget.remaining < lowest.remaining)) {
      lowest = budget;
    }
  }
  return lowest;
}

/** A client that routes each repository to the first of `clients` that reads it; the first client answers the rest. */
export function createTokenRouter(clients: readonly ForgeClient[]): ForgeClient {
  const primary = clients[0];
  if (primary === undefined) {
    throw new Error("createTokenRouter: at least one client is needed");
  }
  if (clients.length === 1) {
    return primary;
  }
  const first: ForgeClient = primary;
  const picks = new Map<string, Promise<Pick>>();

  async function pickClient(owner: string, name: string): Promise<Pick> {
    let firstFailure: Pick | null = null;
    for (const client of clients) {
      const answer = await client.getRepository(owner, name);
      if (answer.ok) {
        return { ok: true, client, repository: answer.value };
      }
      firstFailure ??= answer;
    }
    // Every client was asked; the first one's failure is the answer (`clients` is not empty).
    return firstFailure ?? { ok: false, kind: "not_found" };
  }

  function pick(owner: string, name: string): Promise<Pick> {
    const key = repositoryKey(owner, name);
    let picked = picks.get(key);
    if (picked === undefined) {
      picked = pickClient(owner, name);
      picks.set(key, picked);
    }
    return picked;
  }

  async function onRepository<T>(owner: string, name: string, call: (client: ForgeClient) => Promise<ForgeRead<T>>): Promise<ForgeRead<T>> {
    const picked = await pick(owner, name);
    return picked.ok ? call(picked.client) : picked;
  }

  async function onPath<T>(path: string, call: (client: ForgeClient) => Promise<ForgeRead<T>>): Promise<ForgeRead<T>> {
    const repository = findPathRepository(path);
    return repository === null ? call(first) : onRepository(repository.owner, repository.name, call);
  }

  return {
    getRepository: async (owner, name) => {
      const picked = await pick(owner, name);
      return picked.ok ? { ok: true, value: picked.repository } : picked;
    },
    probe: (path) => onPath(path, (client) => client.probe(path)),
    getJson: (path, schema) => onPath(path, (client) => client.getJson(path, schema)),
    getJsonFile: (owner, name, path, ref) => onRepository(owner, name, (client) => client.getJsonFile(owner, name, path, ref)),
    listOwnerWordIssues: (owner, name) => onRepository(owner, name, (client) => client.listOwnerWordIssues(owner, name)),
    hasLabel: (owner, name, label) => onRepository(owner, name, (client) => client.hasLabel(owner, name, label)),
    createIssue: async (owner, name, issue) => {
      const picked = await pick(owner, name);
      // A public repository of another owner is readable by the first token, but only its owner's token may write.
      const order = picked.ok ? [picked.client, ...clients.filter((client) => client !== picked.client)] : clients;
      let first: ForgeRead<CreatedForgeIssue> | null = null;
      for (const client of order) {
        const answer = await client.createIssue(owner, name, issue);
        if (answer.ok || !WRITE_RETRY_KINDS.has(answer.kind)) {
          return answer;
        }
        first ??= answer;
      }
      return first ?? { ok: false, kind: "not_found" };
    },
    getBudget: () => getLowestBudget(clients),
  };
}
