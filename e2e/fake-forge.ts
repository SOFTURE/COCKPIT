// A fake forge for the e2e: a few fictional repositories answering the reads COCKPIT makes (state, owner-word
// issues, latest release, workflow runs, the `context-doctor` check run and jobs) and its one write, creating an owner-word issue.
// `GET /__issues/<owner>/<name>` (no token) lists what was created, for assertions. Under `/grafana` it also plays
// the observability backend: Grafana's rules API answering the states of the fictional projects' alert rules.
// Run: `npx tsx e2e/fake-forge.ts` (port FAKE_FORGE_PORT, default 3101).
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createRulesFile, createRuleStatesAnswer, type FixtureRuleState } from "../tests/support/grafana-fixture.ts";
import { createStateFixture } from "../tests/support/state-fixture.ts";
import { E2E_FORGE_TOKEN, E2E_GRAFANA_PATH, E2E_GRAFANA_TOKEN, FAKE_FORGE_PORT } from "./fixtures.ts";

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
  /** The repository lacks the `owner-word` label. */
  readonly noOwnerWordLabel?: boolean;
  /** The `context-doctor` check runs on the main branch's head; none unless set. */
  readonly doctorRuns?: readonly unknown[];
  /** Annotations per check run id. */
  readonly annotations?: Readonly<Record<string, readonly unknown[]>>;
  /** Jobs per workflow run id. */
  readonly jobs?: Readonly<Record<string, readonly unknown[]>>;
  /** `ops/grafana/rules.json`, the project's alert rules; none answers 404. */
  readonly rulesFile?: unknown;
}

interface CreatedIssue {
  readonly number: number;
  readonly title: string;
  readonly body: string;
  readonly labels: readonly string[];
  readonly createdAt: string;
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

/** A `context-doctor` check run (or job) as the forge lists it. */
function doctorRun(id: number, status: string, conclusion: string | null) {
  return {
    id,
    name: "context-doctor",
    status,
    conclusion,
    html_url: `https://forge.example.test/checks/${String(id)}`,
    started_at: "2026-11-05T10:00:00Z",
    output: { annotations_count: conclusion === "failure" ? 3 : 0 },
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
    doctorRuns: [doctorRun(71, "completed", "failure")],
    annotations: { "71": [{ title: "context-doctor failure codes", message: "archive.unstamped (1), roadmap.stale (2)" }] },
  },
  {
    fullName: "example-org/xi-app",
    hasState: true,
    // A fine-grained token cannot read check runs: the doctor comes from the jobs of the run at the head.
    refused: { "/commits/main/check-runs": "checks=read" },
    state: createStateFixture({ project: "xi-app" }),
    runs: [{ ...workflowRun("ci", "success", "2026-11-05T11:00:00Z"), id: 501, head_sha: "c0ffee1" }],
    jobs: { "501": [{ ...doctorRun(502, "completed", "success"), name: "context-doctor" }] },
  },
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
    doctorRuns: [doctorRun(81, "in_progress", null)],
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
    doctorRuns: [doctorRun(91, "completed", "success")],
  },
];

/** The health projects (FR-17): firing, quiet, rules never applied, and no rules file at all. */
const HEALTH_REPOSITORIES: readonly FakeRepository[] = [
  {
    fullName: "example-org/omicron-app",
    hasState: true,
    refused: {},
    state: createStateFixture({ project: "omicron-app", owner_queue: [], active_roadmap: null, open_changes: [] }),
    rulesFile: createRulesFile("omicron-alerts", [
      { uid: "omicron-silent", title: "Omicron app silent" },
      { uid: "omicron-errors", title: "Omicron app logs errors" },
    ]),
  },
  {
    fullName: "example-org/pi-app",
    hasState: true,
    refused: {},
    state: createStateFixture({ project: "pi-app", owner_queue: [], active_roadmap: null, open_changes: [] }),
    rulesFile: createRulesFile("pi-alerts", [{ uid: "pi-silent", title: "Pi app silent" }]),
  },
  {
    fullName: "example-org/rho-app",
    hasState: true,
    refused: {},
    state: createStateFixture({ project: "rho-app", owner_queue: [], active_roadmap: null, open_changes: [] }),
    rulesFile: createRulesFile("rho-alerts", [{ uid: "rho-silent", title: "Rho app silent" }]),
  },
  {
    fullName: "example-org/sigma-app",
    hasState: true,
    refused: {},
    state: createStateFixture({ project: "sigma-app", owner_queue: [], active_roadmap: null, open_changes: [] }),
  },
];

/** What the fake Grafana reports: omicron fires, pi is quiet, rho's rules were never applied. */
const RULE_STATES: readonly FixtureRuleState[] = [
  { uid: "omicron-silent", title: "Omicron app silent", state: "firing", folderUid: "omicron-alerts" },
  { uid: "omicron-errors", title: "Omicron app logs errors", state: "inactive", folderUid: "omicron-alerts" },
  { uid: "pi-silent", title: "Pi app silent", state: "inactive", folderUid: "pi-alerts" },
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
  ...OVERVIEW_REPOSITORIES,
  ...HEALTH_REPOSITORIES,
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
  if (url.pathname === `${E2E_GRAFANA_PATH}/api/prometheus/grafana/api/v1/rules` && request.method === "GET") {
    if (request.headers.authorization !== `Bearer ${E2E_GRAFANA_TOKEN}`) {
      send(response, 401, { message: "Unauthorized" });
      return;
    }
    const folderUid = url.searchParams.get("folder_uid");
    send(response, 200, createRuleStatesAnswer(RULE_STATES.filter((rule) => folderUid === null || rule.folderUid === folderUid)));
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
  } else if (rest === "/contents/ops/grafana/rules.json") {
    send(response, repository.rulesFile === undefined ? 404 : 200, repository.rulesFile ?? { message: "Not Found" });
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
    send(response, 200, { total_count: repository.runs?.length ?? 0, workflow_runs: repository.runs ?? [] });
  } else if (rest === "/commits/main/check-runs") {
    const runs = url.searchParams.get("check_name") === "context-doctor" ? (repository.doctorRuns ?? []) : [];
    send(response, 200, { total_count: runs.length, check_runs: runs });
  } else if (/^\/check-runs\/\d+\/annotations$/.test(rest)) {
    send(response, 200, repository.annotations?.[rest.split("/")[2] ?? ""] ?? []);
  } else if (/^\/actions\/runs\/\d+\/jobs$/.test(rest)) {
    const jobs = repository.jobs?.[rest.split("/")[3] ?? ""] ?? [];
    send(response, 200, { total_count: jobs.length, jobs });
  } else if (rest === "/releases/latest") {
    send(response, repository.release === undefined ? 404 : 200, repository.release ?? { message: "Not Found" });
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
