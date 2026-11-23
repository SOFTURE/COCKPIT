// A fake forge for the e2e: a few fictional repositories answering the reads COCKPIT makes (state, owner-word
// issues, latest release, workflow runs), nothing else.
// Run: `npx tsx e2e/fake-forge.ts` (port FAKE_FORGE_PORT, default 3101).
import { createServer, type ServerResponse } from "node:http";
import { createStateFixture } from "../tests/support/state-fixture.ts";
import { E2E_FORGE_TOKEN, FAKE_FORGE_PORT } from "./fixtures.ts";

interface FakeRepository {
  readonly fullName: string;
  readonly hasState: boolean;
  /** The state file served; a valid version 2 state unless set. */
  readonly state?: unknown;
  /** Paths (after `/repos/<owner>/<name>`) refused with 403, with the permission the forge names. */
  readonly refused: Readonly<Record<string, string>>;
  /** The latest release (`releases/latest`); none answers 404. */
  readonly release?: { readonly tag_name: string; readonly published_at: string };
  /** The main branch's workflow runs, newest first. */
  readonly runs?: readonly unknown[];
}

/** A workflow run as the forge lists it. */
function workflowRun(workflow: "ci" | "quality-review", conclusion: string, createdAt: string) {
  return {
    name: workflow,
    path: `.github/workflows/${workflow}.yml`,
    status: "completed",
    conclusion,
    html_url: `https://forge.example.test/runs/${workflow}-${createdAt}`,
    created_at: createdAt,
    updated_at: createdAt,
  };
}

/** The overview's fictional projects: one per status (eta-app above waits for the owner too). */
const OVERVIEW_REPOSITORIES: readonly FakeRepository[] = [
  {
    fullName: "example-org/kappa-app",
    hasState: true,
    refused: {},
    state: createStateFixture({ project: "kappa-app", owner_queue: [] }),
    runs: [workflowRun("ci", "failure", "2026-11-05T10:00:00Z"), workflowRun("ci", "success", "2026-11-04T10:00:00Z")],
  },
  { fullName: "example-org/xi-app", hasState: true, refused: {}, state: createStateFixture({ project: "xi-app" }) },
  {
    fullName: "example-org/nu-app",
    hasState: true,
    refused: {},
    state: createStateFixture({ project: "nu-app", owner_queue: [], updated_at: "2026-11-01T10:00:00Z" }),
  },
  {
    fullName: "example-org/lambda-app",
    hasState: true,
    refused: {},
    // Changed just now: open work within the stall threshold.
    state: createStateFixture({ project: "lambda-app", owner_queue: [], updated_at: new Date().toISOString() }),
  },
  {
    fullName: "example-org/mu-app",
    hasState: true,
    refused: {},
    state: createStateFixture({
      project: "mu-app",
      owner_queue: [],
      active_roadmap: null,
      queued: [{ slug: "mu-v2", title: "Mu v2", status: "queued", path: "context/foundation/roadmaps/mu-v2.md", start_condition: null, done: 0, total: 4, items: [] }],
    }),
    release: { tag_name: "v1.4.0", published_at: "2026-11-03T12:00:00Z" },
    runs: [workflowRun("quality-review", "success", "2026-11-06T09:00:00Z"), workflowRun("ci", "success", "2026-11-05T09:00:00Z")],
  },
];

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
  ...OVERVIEW_REPOSITORIES,
];

function send(response: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}) {
  response.writeHead(status, { "content-type": "application/json", ...headers });
  response.end(JSON.stringify(body));
}

const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", "http://fake-forge.local");
  if (url.pathname === "/health") {
    send(response, 200, { status: "ok" });
    return;
  }
  if (request.method !== "GET" || request.headers.authorization !== `Bearer ${E2E_FORGE_TOKEN}`) {
    send(response, request.method === "GET" ? 401 : 405, { message: "Refused" });
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
  } else if (rest === "/pulls" || rest === "/issues") {
    send(response, 200, []);
  } else if (rest === "/actions/runs") {
    send(response, 200, { total_count: repository.runs?.length ?? 0, workflow_runs: repository.runs ?? [] });
  } else if (rest === "/releases/latest") {
    send(response, repository.release === undefined ? 404 : 200, repository.release ?? { message: "Not Found" });
  } else {
    send(response, 404, { message: "Not Found" });
  }
});

server.listen(FAKE_FORGE_PORT, "127.0.0.1");
