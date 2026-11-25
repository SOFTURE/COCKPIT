// A client of the forge's REST API (GitHub's shape), with the token from the environment. It reads, and its one
// write is `createIssue` (NFR-7: COCKPIT only creates owner-word issues); failures carry a code and the status,
// never the token or the URL (requestJson). Every failed call and the write leave a log line with the method, the path
// (without its query), the status and the failure kind. A missing file or label is normal, and a refusal is what a
// token of another owner answers before the router tries the next one (token-router.ts): both are logged at debug,
// and the caller that gives up logs its own outcome (the scan per project, an answer, a broadcast).
import { createLogger, type Logger } from "@softure-ai/observability";
import { parseLinkHeader, requestJson, type FetchFunction, type HttpJsonFailure } from "@softure-ai/core";
import { z } from "zod";
import { ISSUE_LABELS } from "./issue-label.ts";

export const DEFAULT_FORGE_API_URL = "https://api.github.com";

/** The header naming the fine-grained permission a refused call needed, e.g. `contents=read`. */
export const ACCEPTED_PERMISSIONS_HEADER = "x-accepted-github-permissions";

const READ_HEADERS = [ACCEPTED_PERMISSIONS_HEADER, "x-ratelimit-remaining", "x-ratelimit-reset", "link"] as const;

/** Pages of owner-word issues read per project at most (100 each). */
const MAX_ISSUE_PAGES = 5;

const repositorySchema = z.object({ full_name: z.string(), default_branch: z.string() });

const issueSchema = z.object({
  number: z.number().int(),
  title: z.string(),
  state: z.enum(["open", "closed"]),
  body: z.string().nullable().optional(),
  html_url: z.string(),
  created_at: z.string(),
  closed_at: z.string().nullable(),
  pull_request: z.unknown().optional(),
});

export type ForgeRepository = z.infer<typeof repositorySchema>;

export interface ForgeIssue {
  readonly number: number;
  readonly title: string;
  readonly state: "open" | "closed";
  readonly body: string;
  readonly url: string;
  readonly createdAt: string;
  readonly closedAt: string | null;
}

/** What the forge said about its request budget on the last answer. */
export interface ForgeBudget {
  readonly remaining: number | null;
  /** Epoch seconds when the budget refills. */
  readonly resetAt: number | null;
}

export type ForgeReadFailure =
  | { readonly kind: "not_found" }
  // `token` names the configured token that gave the answer (its label, never its text), when a router asked several.
  | { readonly kind: "unauthorized"; readonly token?: string }
  | {
      readonly kind: "refused";
      readonly status: number | null;
      readonly acceptedPermissions: string | null;
      readonly token?: string;
    }
  | { readonly kind: "rate_limited"; readonly retryAfterSeconds: number | null }
  | { readonly kind: "invalid_answer" }
  | { readonly kind: "unavailable" };

export type ForgeRead<T> = { readonly ok: true; readonly value: T } | ({ readonly ok: false } & ForgeReadFailure);

/** A new issue: COCKPIT only ever sends owner-word issues. */
export interface NewForgeIssue {
  readonly title: string;
  readonly body: string;
  readonly labels: readonly string[];
}

export interface CreatedForgeIssue {
  readonly number: number;
  readonly url: string;
}

export interface ForgeClient {
  getRepository(owner: string, name: string): Promise<ForgeRead<ForgeRepository>>;
  /** A GET whose body is not needed: answers whether the token may read the path. */
  probe(path: string): Promise<ForgeRead<undefined>>;
  /** A GET of `path` (below the API root) whose JSON body is narrowed with `schema`. */
  getJson<T>(path: string, schema: z.ZodType<T>): Promise<ForgeRead<T>>;
  /** A JSON file of the repository at `ref`, parsed but not checked. */
  getJsonFile(owner: string, name: string, path: string, ref: string): Promise<ForgeRead<unknown>>;
  /** Every issue labelled `cockpit` or the older `owner-word`, open and closed, once each, newest first. */
  listOwnerWordIssues(owner: string, name: string): Promise<ForgeRead<ForgeIssue[]>>;
  /** Whether the repository has the label (`not_found` is a plain `false`). */
  hasLabel(owner: string, name: string, label: string): Promise<ForgeRead<boolean>>;
  /** The client's only write: creates one issue. `unavailable` may still have created it (a lost answer). */
  createIssue(owner: string, name: string, issue: NewForgeIssue): Promise<ForgeRead<CreatedForgeIssue>>;
  /** The budget the last answer reported. */
  getBudget(): ForgeBudget;
}

export interface ForgeClientOptions {
  readonly token: string;
  readonly baseUrl?: string;
  readonly fetch?: FetchFunction;
  /** Where calls are logged; `forge` by default. */
  readonly logger?: Logger;
}

/** Read failures a caller expects (a file a project does not have, a token of another owner): debug, not warn. */
const QUIET_READ_FAILURES = new Set<ForgeReadFailure["kind"]>(["not_found", "refused", "unauthorized"]);

const createdIssueSchema = z.object({ number: z.number().int(), html_url: z.string() });

function toNumber(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value.trim() === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** The path of a forge URL without its origin and query: repository names only, never a token or a parameter. */
export function toLoggedPath(urlOrPath: string, root: string): string {
  const path = urlOrPath.startsWith(root) ? urlOrPath.slice(root.length) : urlOrPath.replace(/^https?:\/\/[^/]+/, "");
  return path.split("?")[0] ?? "";
}

export function createForgeClient({ token, baseUrl = DEFAULT_FORGE_API_URL, fetch, logger = createLogger("forge") }: ForgeClientOptions): ForgeClient {
  const root = baseUrl.replace(/\/+$/, "");
  const baseHeaders = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
  let budget: ForgeBudget = { remaining: null, resetAt: null };

  function noteBudget(headers: Readonly<Record<string, string | null>> | undefined) {
    if (headers === undefined) {
      return;
    }
    const remaining = toNumber(headers["x-ratelimit-remaining"]);
    const resetAt = toNumber(headers["x-ratelimit-reset"]);
    if (remaining !== null || resetAt !== null) {
      budget = { remaining, resetAt };
    }
  }

  async function read<T>(
    urlOrPath: string,
    schema: z.ZodType<T>,
    accept?: string,
  ): Promise<ForgeRead<{ body: T; link: string | null }>> {
    const result = await requestJson({
      url: urlOrPath.startsWith("http") ? urlOrPath : `${root}${urlOrPath}`,
      headers: accept === undefined ? baseHeaders : { ...baseHeaders, Accept: accept },
      schema,
      fetch,
      readHeaders: [...READ_HEADERS],
    });
    if (result.ok) {
      noteBudget(result.value.headers);
      return { ok: true, value: { body: result.value.body, link: result.value.headers.link } };
    }
    return logFailure("GET", urlOrPath, result.status, toFailure(result));
  }

  async function post<T>(path: string, body: unknown, schema: z.ZodType<T>): Promise<ForgeRead<T>> {
    const result = await requestJson({
      url: `${root}${path}`,
      method: "POST",
      body,
      headers: baseHeaders,
      schema,
      fetch,
      readHeaders: [...READ_HEADERS],
    });
    if (result.ok) {
      noteBudget(result.value.headers);
      // A create always answers with the created resource; an empty answer is not one.
      return result.value.body === undefined
        ? logFailure("POST", path, null, { ok: false, kind: "invalid_answer" })
        : { ok: true, value: result.value.body };
    }
    return logFailure("POST", path, result.status, toFailure(result));
  }

  /** Logs a failed call and hands the failure back: error for a write, debug for an answer the caller may route past. */
  function logFailure(
    method: "GET" | "POST",
    urlOrPath: string,
    status: number | null,
    failure: { readonly ok: false } & ForgeReadFailure,
  ): { readonly ok: false } & ForgeReadFailure {
    const fields = {
      method,
      path: toLoggedPath(urlOrPath, root),
      status: status ?? undefined,
      kind: failure.kind,
      rate_remaining: budget.remaining ?? undefined,
    };
    if (method === "POST") {
      logger.error("forge write failed", fields);
    } else if (QUIET_READ_FAILURES.has(failure.kind)) {
      logger.debug("forge read refused or found nothing", fields);
    } else {
      logger.warn("forge read failed", fields);
    }
    return failure;
  }

  function toFailure(result: HttpJsonFailure): { readonly ok: false } & ForgeReadFailure {
    noteBudget("headers" in result ? result.headers : undefined);
    if (result.error === "core.http_rate_limited") {
      return { ok: false, kind: "rate_limited", retryAfterSeconds: result.retryAfterSeconds };
    }
    if (result.status === 404) {
      return { ok: false, kind: "not_found" };
    }
    if (result.status === 401) {
      return { ok: false, kind: "unauthorized" };
    }
    if (result.error === "core.http_refused") {
      const headers = "headers" in result ? result.headers : undefined;
      // A 403 with no budget left is the primary rate limit, not a missing permission.
      if (result.status === 403 && budget.remaining === 0) {
        return { ok: false, kind: "rate_limited", retryAfterSeconds: null };
      }
      return { ok: false, kind: "refused", status: result.status, acceptedPermissions: headers?.[ACCEPTED_PERMISSIONS_HEADER] ?? null };
    }
    if (result.error === "core.http_unexpected_answer" && result.status !== null && result.status < 300) {
      return { ok: false, kind: "invalid_answer" };
    }
    if (result.error === "core.http_unexpected_answer" && result.status !== null && result.status >= 400 && result.status < 500) {
      // A 422 and its kin: the forge read the request and turned it down.
      return { ok: false, kind: "refused", status: result.status, acceptedPermissions: null };
    }
    return { ok: false, kind: "unavailable" };
  }

  const repositoryPath = (owner: string, name: string) => `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;

  async function listLabelledIssues(owner: string, name: string, label: string): Promise<ForgeRead<ForgeIssue[]>> {
    const issues: ForgeIssue[] = [];
    let next: string | undefined = `${repositoryPath(owner, name)}/issues?labels=${encodeURIComponent(label)}&state=all&per_page=100`;
    for (let page = 0; next !== undefined && page < MAX_ISSUE_PAGES; page += 1) {
      const answer: ForgeRead<{ body: z.infer<typeof issueSchema>[]; link: string | null }> = await read(next, z.array(issueSchema));
      if (!answer.ok) {
        return answer;
      }
      for (const issue of answer.value.body) {
        // The issues API lists pull requests too; an owner word is never one.
        if (issue.pull_request === undefined) {
          issues.push({
            number: issue.number,
            title: issue.title,
            state: issue.state,
            body: issue.body ?? "",
            url: issue.html_url,
            createdAt: issue.created_at,
            closedAt: issue.closed_at,
          });
        }
      }
      next = parseLinkHeader(answer.value.link).next;
    }
    return { ok: true, value: issues };
  }

  return {
    getRepository: async (owner, name) => {
      const answer = await read(repositoryPath(owner, name), repositorySchema);
      return answer.ok ? { ok: true, value: answer.value.body } : answer;
    },
    probe: async (path) => {
      const answer = await read(path, z.unknown());
      return answer.ok ? { ok: true, value: undefined } : answer;
    },
    getJson: async (path, schema) => {
      const answer = await read(path, schema);
      return answer.ok ? { ok: true, value: answer.value.body } : answer;
    },
    getJsonFile: async (owner, name, path, ref) => {
      const encodedPath = path.split("/").map(encodeURIComponent).join("/");
      const answer = await read(
        `${repositoryPath(owner, name)}/contents/${encodedPath}?ref=${encodeURIComponent(ref)}`,
        z.unknown(),
        "application/vnd.github.raw+json",
      );
      return answer.ok ? { ok: true, value: answer.value.body } : answer;
    },
    listOwnerWordIssues: async (owner, name) => {
      // The issues API reads several labels as all of them, so each label is its own list.
      const byNumber = new Map<number, ForgeIssue>();
      for (const label of ISSUE_LABELS) {
        const listed = await listLabelledIssues(owner, name, label);
        if (!listed.ok) {
          return listed;
        }
        for (const issue of listed.value) {
          byNumber.set(issue.number, issue);
        }
      }
      return { ok: true, value: [...byNumber.values()].sort((a, b) => b.number - a.number) };
    },
    hasLabel: async (owner, name, label) => {
      const answer = await read(`${repositoryPath(owner, name)}/labels/${encodeURIComponent(label)}`, z.unknown());
      if (answer.ok) {
        return { ok: true, value: true };
      }
      return answer.kind === "not_found" ? { ok: true, value: false } : answer;
    },
    createIssue: async (owner, name, issue) => {
      const answer = await post(
        `${repositoryPath(owner, name)}/issues`,
        { title: issue.title, body: issue.body, labels: [...issue.labels] },
        createdIssueSchema,
      );
      if (!answer.ok) {
        return answer;
      }
      logger.info("forge issue created", { repository: `${owner}/${name}`, issue: answer.value.number, labels: [...issue.labels] });
      return { ok: true, value: { number: answer.value.number, url: answer.value.html_url } };
    },
    getBudget: () => budget,
  };
}
