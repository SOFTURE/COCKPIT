// A stateful fake forge for answer tests: one fictional repository's labels and issues, the calls it received, and
// scripted failures of the issue creation. Only the calls COCKPIT's answer path makes are answered.
import type { FakeFetchCall } from "@softure-ai/testing";
import { TEST_FORGE_API } from "./fake-forge-routes.ts";

export interface MemoryIssue {
  number: number;
  title: string;
  body: string;
  labels: string[];
  state: "open" | "closed";
  createdAt: string;
}

/** How the next issue creations fail: refused, down, or created but the answer is lost (a 504 after the write). */
export type CreateFailure = { readonly status: number; readonly created?: boolean };

export interface MemoryForge {
  readonly fetch: (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
  readonly calls: FakeFetchCall[];
  readonly issues: MemoryIssue[];
  labels: Set<string>;
  /** Consumed one per creation. */
  readonly createFailures: CreateFailure[];
  /** What `created_at` the next issue gets. */
  now: () => Date;
  close(number: number): void;
  issueUrl(number: number): string;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

export function createMemoryForge(fullName: string, now: () => Date = () => new Date()): MemoryForge {
  const base = `${TEST_FORGE_API}/repos/${fullName}`;
  const forge: MemoryForge = {
    calls: [],
    issues: [],
    labels: new Set(["owner-word"]),
    createFailures: [],
    now,
    close(number) {
      const issue = forge.issues.find((candidate) => candidate.number === number);
      if (issue !== undefined) {
        issue.state = "closed";
      }
    },
    issueUrl: (number) => `https://forge.example.test/${fullName}/issues/${String(number)}`,
    fetch: async (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const method = (init?.method ?? "GET").toUpperCase();
      const body = typeof init?.body === "string" ? init.body : null;
      let parsed: unknown;
      try {
        parsed = body === null ? undefined : JSON.parse(body);
      } catch {
        parsed = undefined;
      }
      forge.calls.push({ method, url, headers: {}, body, json: parsed });
      // Yield once, so two answers at once interleave as two requests would.
      await Promise.resolve();

      if (method === "GET" && url.startsWith(`${base}/labels/`)) {
        const label = decodeURIComponent(url.slice(`${base}/labels/`.length));
        return forge.labels.has(label) ? json(200, { name: label }) : json(404, { message: "Not Found" });
      }
      if (method === "GET" && url.startsWith(`${base}/issues?`)) {
        const listed = [...forge.issues]
          .filter((issue) => issue.labels.includes("owner-word"))
          .reverse()
          .map((issue) => ({
            number: issue.number,
            title: issue.title,
            state: issue.state,
            body: issue.body,
            html_url: forge.issueUrl(issue.number),
            created_at: issue.createdAt,
            closed_at: issue.state === "closed" ? issue.createdAt : null,
          }));
        return json(200, listed);
      }
      if (method === "POST" && url === `${base}/issues`) {
        const failure = forge.createFailures.shift();
        if (failure !== undefined && failure.created !== true) {
          return json(failure.status, { message: "Scripted failure" });
        }
        const request = parsed as { title: string; body: string; labels: string[] };
        const issue: MemoryIssue = {
          number: forge.issues.length + 1,
          title: request.title,
          body: request.body,
          labels: [...request.labels],
          state: "open",
          createdAt: forge.now().toISOString(),
        };
        forge.issues.push(issue);
        if (failure !== undefined) {
          return json(failure.status, { message: "The answer was lost" });
        }
        return json(201, { number: issue.number, html_url: forge.issueUrl(issue.number) });
      }
      return json(404, { message: "Not Found" });
    },
  };
  return forge;
}

export interface MemoryForges {
  /** Routes each request to the forge of its repository. */
  readonly fetch: (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
  /** Every forge's calls, in the order they arrived. */
  readonly calls: FakeFetchCall[];
  get(fullName: string): MemoryForge;
}

/** Several fictional repositories behind one fetch, for work that reaches more than one project. */
export function createMemoryForges(fullNames: readonly string[], now: () => Date = () => new Date()): MemoryForges {
  const forges = new Map(fullNames.map((fullName) => [fullName, createMemoryForge(fullName, now)]));
  const calls: FakeFetchCall[] = [];
  return {
    calls,
    get(fullName) {
      const forge = forges.get(fullName);
      if (forge === undefined) {
        throw new Error(`createMemoryForges: no forge for ${fullName}`);
      }
      return forge;
    },
    fetch: async (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const forge = [...forges.entries()].find(([fullName]) => url.startsWith(`${TEST_FORGE_API}/repos/${fullName}/`))?.[1];
      if (forge === undefined) {
        calls.push({ method: (init?.method ?? "GET").toUpperCase(), url, headers: {}, body: null, json: undefined });
        return json(404, { message: "Not Found" });
      }
      const response = await forge.fetch(input, init);
      const call = forge.calls.at(-1);
      if (call !== undefined) {
        calls.push(call);
      }
      return response;
    },
  };
}
