// A fake forge for the e2e: a few fictional repositories answering the reads COCKPIT makes and its one write,
// creating an owner-word issue. `GET /__issues/<owner>/<name>` (no token) lists what was created, for assertions.
// Run: `npx tsx e2e/fake-forge.ts` (port FAKE_FORGE_PORT, default 3101).
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createStateFixture } from "../tests/support/state-fixture.ts";
import { E2E_FORGE_TOKEN, FAKE_FORGE_PORT } from "./fixtures.ts";

interface FakeRepository {
  readonly fullName: string;
  readonly hasState: boolean;
  /** The state file served; a valid version 2 state unless set. */
  readonly state?: unknown;
  /** Paths (after `/repos/<owner>/<name>`) refused with 403, with the permission the forge names. */
  readonly refused: Readonly<Record<string, string>>;
  /** The repository lacks the `owner-word` label. */
  readonly noOwnerWordLabel?: boolean;
}

interface CreatedIssue {
  readonly number: number;
  readonly title: string;
  readonly body: string;
  readonly labels: readonly string[];
  readonly createdAt: string;
}

/** Fictional repositories; any other name answers 404, like one outside the token's selection. */
const FAKE_REPOSITORIES: readonly FakeRepository[] = [
  { fullName: "example-org/alpha-app", hasState: true, refused: {} },
  { fullName: "example-org/beta-app", hasState: false, refused: {} },
  { fullName: "example-org/gamma-app", hasState: true, refused: { "/contents/context/state.json": "contents=read" } },
  { fullName: "example-org/delta-app", hasState: true, refused: { "/actions/runs": "actions=read" } },
  { fullName: "example-org/zeta-app", hasState: true, refused: {} },
  {
    fullName: "example-org/eta-app",
    hasState: true,
    refused: {},
    state: createStateFixture({
      project: "eta-app",
      owner_queue: [
        { id: "oq-eta-1", kind: "decision", source: "context/foundation/roadmap.md", item: "ET-4", since: "2026-11-02", text: "Approve the eta-app release plan" },
        { id: "oq-eta-2", kind: "secret", source: "context/foundation/roadmap.md", item: null, since: "2026-11-15", text: "Set the eta-app mail provider key" },
      ],
    }),
  },
  { fullName: "example-org/epsilon-app", hasState: true, state: { schema_version: 2, project: "epsilon-app" }, refused: {} },
  {
    fullName: "example-org/theta-app",
    hasState: true,
    refused: {},
    state: createStateFixture({
      project: "theta-app",
      owner_queue: [
        { id: "oq-theta-1", kind: "decision", source: "context/foundation/roadmap.md", item: "TH-2", since: "2026-11-05", text: "Approve the theta-app pricing page" },
      ],
    }),
  },
  {
    fullName: "example-org/iota-app",
    hasState: true,
    refused: {},
    noOwnerWordLabel: true,
    state: createStateFixture({
      project: "iota-app",
      owner_queue: [
        { id: "oq-iota-1", kind: "step", source: "context/foundation/roadmap.md", item: "IO-1", since: "2026-11-06", text: "Confirm the iota-app import format" },
      ],
    }),
  },
];

const createdIssues = new Map<string, CreatedIssue[]>();

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

function toIssueAnswer(fullName: string, issue: CreatedIssue) {
  return {
    number: issue.number,
    title: issue.title,
    state: "open",
    body: issue.body,
    html_url: `http://127.0.0.1:${String(FAKE_FORGE_PORT)}/${fullName}/issues/${String(issue.number)}`,
    created_at: issue.createdAt,
    closed_at: null,
    labels: issue.labels.map((name) => ({ name })),
  };
}

function send(response: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}) {
  response.writeHead(status, { "content-type": "application/json", ...headers });
  response.end(JSON.stringify(body));
}

async function handle(request: IncomingMessage, response: ServerResponse) {
  const url = new URL(request.url ?? "/", "http://fake-forge.local");
  if (url.pathname === "/health") {
    send(response, 200, { status: "ok" });
    return;
  }
  const inspected = /^\/__issues\/([^/]+)\/([^/]+)$/.exec(url.pathname);
  if (inspected !== null && request.method === "GET") {
    const fullName = `${inspected[1] ?? ""}/${inspected[2] ?? ""}`;
    send(response, 200, createdIssues.get(fullName) ?? []);
    return;
  }
  const isIssueCreation = request.method === "POST" && /^\/repos\/[^/]+\/[^/]+\/issues$/.test(url.pathname);
  if ((request.method !== "GET" && !isIssueCreation) || request.headers.authorization !== `Bearer ${E2E_FORGE_TOKEN}`) {
    send(response, request.method === "GET" || isIssueCreation ? 401 : 405, { message: "Refused" });
    return;
  }
  const match = /^\/repos\/([^/]+)\/([^/]+)(\/.*)?$/.exec(url.pathname);
  const repository = FAKE_REPOSITORIES.find(
    (candidate) => match !== null && candidate.fullName === `${decodeURIComponent(match[1] ?? "")}/${decodeURIComponent(match[2] ?? "")}`.toLowerCase(),
  );
  if (match === null || repository === undefined) {
    send(response, 404, { message: "Not Found" });
    return;
  }
  const rest = match[3] ?? "";
  const refusal = repository.refused[rest];
  if (refusal !== undefined) {
    send(response, 403, { message: "Resource not accessible by personal access token" }, { "x-accepted-github-permissions": refusal });
    return;
  }
  if (rest === "") {
    send(response, 200, { full_name: repository.fullName, default_branch: "main" });
  } else if (rest === "/contents/context/state.json") {
    const state = repository.state ?? createStateFixture({ project: repository.fullName.split("/")[1] ?? "project" });
    send(response, repository.hasState ? 200 : 404, repository.hasState ? state : { message: "Not Found" });
  } else if (rest === "/issues" && request.method === "POST") {
    const payload = JSON.parse(await readBody(request)) as { title: string; body: string; labels: string[] };
    const list = createdIssues.get(repository.fullName) ?? [];
    const issue: CreatedIssue = { number: list.length + 1, title: payload.title, body: payload.body, labels: payload.labels, createdAt: new Date().toISOString() };
    createdIssues.set(repository.fullName, [...list, issue]);
    send(response, 201, toIssueAnswer(repository.fullName, issue));
  } else if (rest === "/issues") {
    const list = url.searchParams.get("labels") === "owner-word" ? (createdIssues.get(repository.fullName) ?? []) : [];
    send(response, 200, [...list].reverse().map((issue) => toIssueAnswer(repository.fullName, issue)));
  } else if (rest === "/labels/owner-word") {
    send(response, repository.noOwnerWordLabel === true ? 404 : 200, repository.noOwnerWordLabel === true ? { message: "Not Found" } : { name: "owner-word" });
  } else if (rest === "/pulls") {
    send(response, 200, []);
  } else if (rest === "/actions/runs") {
    send(response, 200, { total_count: 0, workflow_runs: [] });
  } else {
    send(response, 404, { message: "Not Found" });
  }
}

const server = createServer((request, response) => {
  handle(request, response).catch((error: unknown) => {
    console.error(`fake forge: answering ${request.method ?? "?"} ${request.url ?? "?"} failed: ${error instanceof Error ? error.message : "unknown"}`);
    send(response, 500, { message: "Fake forge failure" });
  });
});

server.listen(FAKE_FORGE_PORT, "127.0.0.1");
