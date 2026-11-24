// A fake forge for the e2e: a few fictional repositories answering the reads COCKPIT makes (the token's repository
// list, state, owner-word issues, latest release, releases with their deploy reports, closed pull requests, workflow runs, the deploy
// workflow's runs, the `context-doctor` check run and jobs) and its one write, creating an owner-word issue.
// `GET /__issues/<owner>/<name>` (no token) lists what was created, for assertions. Under `/grafana` it also plays
// the observability backend: Grafana's rules API answering the states of the fictional projects' alert rules.
// Run: `npx tsx e2e/fake-forge.ts` (port FAKE_FORGE_PORT, default 3101).
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createRulesFile, createRuleStatesAnswer, type FixtureRuleState } from "../tests/support/grafana-fixture.ts";
import { createReleaseBody, deployRun } from "../tests/support/deploy-fixture.ts";
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
  /** The state is served this many times, then refused (`contents=read`): a later read fails and the last good one stays. */
  readonly refuseStateAfterReads?: number;
  /** Closed pull requests on the main branch (`/pulls`), most recently updated first; none unless set. */
  readonly pulls?: readonly unknown[];
  /** Releases (`/releases`), newest first; none unless set. */
  readonly releases?: readonly unknown[];
  /** `ops/grafana/rules.json`, the project's alert rules; none answers 404. */
  readonly rulesFile?: unknown;
  /** `context/workflow.json`, served raw like the state; none answers 404. */
  readonly workflowFile?: unknown;
  /** The runs of `.github/workflows/deploy.yml`; none answers 404 (no deploy workflow). */
  readonly deployRuns?: readonly unknown[];
  /** Text files served through the contents API (base64), by path. */
  readonly files?: Readonly<Record<string, string>>;
  /** Text files at one ref (`?ref=`), by ref then path; served before `files`. */
  readonly filesAtRef?: Readonly<Record<string, Readonly<Record<string, string>>>>;
  /** Compare answers (`/compare/<base>...<head>`), by `<base>...<head>`; none answers 404. */
  readonly compare?: Readonly<Record<string, { readonly ahead_by: number; readonly commits: readonly unknown[] }>>;
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

/** The project page's fictional projects (FR-10). */
function pageItem(id: string, outcome: string, status: string, stage: string | null = null, detail: string | null = null) {
  return { id, change_id: `omicron-${id.toLowerCase()}`, outcome, status, stage, since: stage === null ? null : "2026-11-18", detail, prerequisites: [], mode: "autonomous" };
}

/** Omicron's roadmap files, as `softure-roadmap` writes them, for the roadmap view. */
const OMICRON_ROADMAP = `---
project: "omicron-app"
roadmap: omicron-v1
version: 2
status: ready
updated: 2026-11-18
---

# Roadmap omicron-v1: notes you can find and share

> Run-wide orders, read by orchestrators (not parsed):
> - Release: after OM-8
> - Parallelism: up to 2 at once

## At a glance

| ID | Change | Outcome | Depends on | Mode | Status |
| --- | --- | --- | --- | --- | --- |
| **OM-1** | \`omicron-om-1\` | notes are stored | — | autonomous | done |
| **OM-2** | \`omicron-om-2\` | notes are edited | OM-1 | autonomous | done |
| **OM-3** | \`omicron-om-3\` | notes are listed | OM-1 | autonomous | done |
| **OM-4** | \`omicron-om-4\` | Search across notes | OM-3 | autonomous | in_progress (implement 2/3, since 2026-11-18) |
| **OM-5** | \`omicron-om-5\` | Export to a file | OM-3 | autonomous | ready_to_merge |
| **OM-6** | \`omicron-om-6\` | Share a read-only link | OM-4 | autonomous | blocked (waits for an upstream fix) |
| **OM-7** | \`omicron-om-7\` | Tags on notes | OM-3 | autonomous | ready |
| **OM-8** | \`omicron-om-8\` | First release | OM-4, OM-5, OM-6, OM-7 | autonomous | ready |

## Items

### OM-4: Search across notes
- **Change ID:** \`omicron-om-4\`
- **Status:** in_progress
- **Outcome:** the owner finds any note by a word in its title or body,
  ranked by how recently it changed.
- **Prerequisites:** OM-3
- **Size:** M
- **Unknowns:**
  - Which index fits the note volume? (owner: research; blocks: no)
- **Risk:** search is the first proof of the product.

### OM-6: Share a read-only link
- **Change ID:** \`omicron-om-6\`
- **Status:** blocked
- **Outcome:** a note is shared through a read-only link.
- **Prerequisites:** OM-4
- **Size:** S

## Before the next release
- [ ] **OM-8**: set the \`SHARE_SECRET\` in production
- [x] **OM-1**: create the storage bucket

## Owner decisions and checks
- [ ] **OM-6**: approve the sharing scope
`;

const OMICRON_V2_ROADMAP = `---
roadmap: omicron-v2
status: queued
---

# Roadmap omicron-v2: notes for teams

## At a glance

| ID | Change | Outcome | Depends on | Mode | Status |
| --- | --- | --- | --- | --- | --- |
| **OV-1** | \`omicron-ov-1\` | teammates see shared notes | — | autonomous | proposed |
| **OV-2** | \`omicron-ov-2\` | teammates comment on notes | OV-1 | autonomous | proposed |
`;

const PROJECT_PAGE_REPOSITORIES: readonly FakeRepository[] = [
  {
    fullName: "example-org/omicron-app",
    hasState: true,
    refused: {},
    files: { "context/foundation/roadmap.md": OMICRON_ROADMAP, "context/foundation/roadmaps/omicron-v2.md": OMICRON_V2_ROADMAP },
    state: createStateFixture({
      project: "omicron-app",
      active_roadmap: {
        slug: "omicron-v1",
        title: "Omicron v1",
        status: "ready",
        version: "2",
        path: "context/foundation/roadmap.md",
        done: 3,
        total: 8,
        items: [
          pageItem("OM-4", "Search across notes", "in_progress", "implement 2/3", "phase 2 of 3"),
          pageItem("OM-5", "Export to a file", "ready_to_merge"),
          pageItem("OM-6", "Share a read-only link", "blocked", null, "waits for an upstream fix"),
          pageItem("OM-7", "Tags on notes", "ready"),
          pageItem("OM-8", "First release", "ready"),
        ],
      },
      queued: [
        { slug: "omicron-v2", title: "Omicron v2", status: "queued", path: "context/foundation/roadmaps/omicron-v2.md", start_condition: "after omicron-v1 is released", done: 0, total: 5, items: [] },
      ],
      open_changes: [
        { change_id: "omicron-om-4", title: "Search across notes", status: "implementing", roadmap_item: "OM-4", updated: "2026-11-19", stage: "implement 2/3" },
        { change_id: "fix-note-dates", title: "Fix the dates of imported notes", status: "planned", roadmap_item: null, updated: "2026-11-18", stage: null },
      ],
      owner_queue: [
        { id: "oq-omicron-1", kind: "decision", source: "context/foundation/roadmap.md", item: "OM-6", since: "2026-11-12", text: "Approve the omicron-app sharing scope" },
      ],
    }),
  },
  {
    fullName: "example-org/pi-app",
    hasState: true,
    refused: {},
    // Served to the access check when added and to the first scan; the second scan is refused.
    refuseStateAfterReads: 2,
    state: createStateFixture({ project: "pi-app", owner_queue: [] }),
  },
  {
    fullName: "example-org/rho-app",
    hasState: true,
    refused: {},
    state: createStateFixture({ project: "rho-app", owner_queue: [], active_roadmap: null }),
  },
];


/** The health projects (FR-17): firing, quiet, rules never applied, and no rules file at all. */
const HEALTH_REPOSITORIES: readonly FakeRepository[] = [
  {
    fullName: "example-org/upsilon-app",
    hasState: true,
    refused: {},
    state: createStateFixture({ project: "upsilon-app", owner_queue: [], active_roadmap: null, open_changes: [] }),
    rulesFile: createRulesFile("upsilon-alerts", [
      { uid: "upsilon-silent", title: "Upsilon app silent" },
      { uid: "upsilon-errors", title: "Upsilon app logs errors" },
    ]),
  },
  {
    fullName: "example-org/phi-app",
    hasState: true,
    refused: {},
    state: createStateFixture({ project: "phi-app", owner_queue: [], active_roadmap: null, open_changes: [] }),
    rulesFile: createRulesFile("phi-alerts", [{ uid: "phi-silent", title: "Phi app silent" }]),
  },
  {
    fullName: "example-org/chi-app",
    hasState: true,
    refused: {},
    state: createStateFixture({ project: "chi-app", owner_queue: [], active_roadmap: null, open_changes: [] }),
    rulesFile: createRulesFile("chi-alerts", [{ uid: "chi-silent", title: "Chi app silent" }]),
  },
  {
    fullName: "example-org/psi-app",
    hasState: true,
    refused: {},
    state: createStateFixture({ project: "psi-app", owner_queue: [], active_roadmap: null, open_changes: [] }),
  },
];

const deployRunUrl = (name: string, id: number) => `https://forge.example.test/example-org/${name}/actions/runs/${String(id)}`;

/** The deploy projects (FR-17): deployed and verified, a failed redeploy over an earlier release, no deploy workflow. */
const DEPLOY_REPOSITORIES: readonly FakeRepository[] = [
  {
    fullName: "example-org/omega-app",
    hasState: true,
    refused: {},
    state: createStateFixture({ project: "omega-app", owner_queue: [], active_roadmap: null, open_changes: [] }),
    deployRuns: [deployRun({ id: 701, event: "release", headBranch: "v2.1.0", createdAt: "2026-11-20T08:00:00Z", htmlUrl: deployRunUrl("omega-app", 701) })],
    releases: [
      {
        tag_name: "v2.1.0",
        html_url: "https://forge.example.test/example-org/omega-app/releases/v2.1.0",
        published_at: "2026-11-20T07:55:00Z",
        body: createReleaseBody([{ when: "2026-11-20 08:06", result: "deployed", verify: "success", runUrl: deployRunUrl("omega-app", 701) }]),
      },
    ],
  },
  {
    fullName: "example-org/omega-web",
    hasState: true,
    refused: {},
    state: createStateFixture({ project: "omega-web", owner_queue: [], active_roadmap: null, open_changes: [] }),
    deployRuns: [
      deployRun({ id: 802, event: "workflow_dispatch", headBranch: "main", conclusion: "failure", createdAt: "2026-11-21T09:00:00Z", htmlUrl: deployRunUrl("omega-web", 802) }),
      deployRun({ id: 801, event: "release", headBranch: "v1.0.0", createdAt: "2026-11-18T09:00:00Z", htmlUrl: deployRunUrl("omega-web", 801) }),
    ],
    releases: [
      {
        tag_name: "v1.1.0",
        html_url: "https://forge.example.test/example-org/omega-web/releases/v1.1.0",
        published_at: "2026-11-21T08:55:00Z",
        body: createReleaseBody([{ when: "2026-11-21 09:04", result: { failedAt: "migrate" }, verify: "skipped", runUrl: deployRunUrl("omega-web", 802) }]),
      },
      {
        tag_name: "v1.0.0",
        html_url: "https://forge.example.test/example-org/omega-web/releases/v1.0.0",
        published_at: "2026-11-18T08:55:00Z",
        body: createReleaseBody([{ when: "2026-11-18 09:05", result: "deployed", verify: "success", runUrl: deployRunUrl("omega-web", 801) }]),
      },
    ],
  },
  {
    fullName: "example-org/omega-docs",
    hasState: true,
    refused: {},
    state: createStateFixture({ project: "omega-docs", owner_queue: [], active_roadmap: null, open_changes: [] }),
  },
];

/** CT-2: what waits for the next deploy, from the compose file at the deployed tag and on main, and the commits since. */
const HARBOR_COMPOSE = [
  "services:",
  "  app:",
  "    environment:",
  "      DATABASE_URL: postgresql://app:${APP_PASSWORD:?}@postgres:5432/app",
  "      APP_ORIGIN: https://${APP_HOST:?}",
  "      LOG_LEVEL: ${LOG_LEVEL:-info}",
  "",
].join("\n");

function harborRepository(name: string, waiting: Pick<FakeRepository, "compare" | "filesAtRef">): FakeRepository {
  return {
    fullName: `example-org/${name}`,
    hasState: true,
    refused: {},
    state: createStateFixture({ project: name, owner_queue: [], active_roadmap: null, open_changes: [] }),
    deployRuns: [deployRun({ id: 901, event: "release", headBranch: "v3.0.0", createdAt: "2026-11-22T08:00:00Z", htmlUrl: deployRunUrl(name, 901) })],
    releases: [
      {
        tag_name: "v3.0.0",
        html_url: `https://forge.example.test/example-org/${name}/releases/v3.0.0`,
        published_at: "2026-11-22T07:50:00Z",
        body: createReleaseBody([{ when: "2026-11-22 08:06", result: "deployed", verify: "success", runUrl: deployRunUrl(name, 901) }]),
      },
    ],
    ...waiting,
  };
}

const mergeCommit = (number: number) => ({ commit: { message: `Merge pull request #${String(number)} from example-org/change-${String(number)}\n\nChange ${String(number)}` } });

/** Up to date; three merged pull requests (one direct push not counted); a compose file that gained a required secret. */
const HARBOR_REPOSITORIES: readonly FakeRepository[] = [
  harborRepository("harbor-app", {
    compare: { "v3.0.0...main": { ahead_by: 0, commits: [] } },
    filesAtRef: { main: { "docker/prod/docker-compose.yml": HARBOR_COMPOSE }, "v3.0.0": { "docker/prod/docker-compose.yml": HARBOR_COMPOSE } },
  }),
  harborRepository("harbor-web", {
    compare: { "v3.0.0...main": { ahead_by: 4, commits: [mergeCommit(41), { commit: { message: "Fix a typo" } }, mergeCommit(42), { commit: { message: "Add search (#43)" } }] } },
    filesAtRef: { main: { "docker/prod/docker-compose.yml": HARBOR_COMPOSE }, "v3.0.0": { "docker/prod/docker-compose.yml": HARBOR_COMPOSE } },
  }),
  harborRepository("harbor-api", {
    compare: { "v3.0.0...main": { ahead_by: 1, commits: [mergeCommit(7)] } },
    filesAtRef: {
      main: { "docker/prod/docker-compose.yml": `${HARBOR_COMPOSE}      MAIL_KEY_SECRET: \${MAIL_KEY_SECRET:?}\n` },
      "v3.0.0": { "docker/prod/docker-compose.yml": HARBOR_COMPOSE },
    },
  }),
];

/** What the fake Grafana reports: upsilon fires, phi is quiet, chi's rules were never applied. */
const RULE_STATES: readonly FixtureRuleState[] = [
  { uid: "upsilon-silent", title: "Upsilon app silent", state: "firing", folderUid: "upsilon-alerts" },
  { uid: "upsilon-errors", title: "Upsilon app logs errors", state: "inactive", folderUid: "upsilon-alerts" },
  { uid: "phi-silent", title: "Phi app silent", state: "inactive", folderUid: "phi-alerts" },
];

/** Fictional repositories; any other name answers 404, like one outside the token's selection. */
/** The history's fictional projects (FR-11): one with everything, one whose release and doctor reads are refused. */
function closedPull(number: number, mergedAt: string | null) {
  return {
    number,
    title: `History change ${String(number)}`,
    html_url: `https://forge.example.test/example-org/history-full-app/pull/${String(number)}`,
    merged_at: mergedAt,
    user: { login: "example-dev" },
  };
}

function publishedRelease(tag: string, publishedAt: string | null, extra: Record<string, unknown> = {}) {
  return { tag_name: tag, name: tag, html_url: `https://forge.example.test/example-org/history-full-app/releases/${tag}`, published_at: publishedAt, draft: publishedAt === null, prerelease: false, ...extra };
}

/** CV-2: what wakes each project on an owner-word issue, as its `context/workflow.json` declares it. */
function wakeRepository(name: string, workflow: unknown): FakeRepository {
  return {
    fullName: `example-org/${name}`,
    hasState: true,
    refused: {},
    state: createStateFixture({ project: name, owner_queue: [], active_roadmap: null, open_changes: [] }),
    workflowFile: workflow,
  };
}

const WAKE_REPOSITORIES: readonly FakeRepository[] = [
  wakeRepository("wake-routine-app", { mode: "autonomous", autonomy: { merge: "pr", ownerWordWake: "routine" } }),
  wakeRepository("wake-heartbeat-app", { mode: "autonomous", autonomy: { merge: "pr", ownerWordWake: "heartbeat" } }),
  wakeRepository("wake-quiet-app", { mode: "autonomous", autonomy: { merge: "pr" } }),
];

const HISTORY_REPOSITORIES: readonly FakeRepository[] = [
  {
    fullName: "example-org/history-full-app",
    hasState: true,
    refused: {},
    state: createStateFixture({ project: "history-full-app", owner_queue: [] }),
    // Twelve merges and one pull request closed unmerged: the history shows the latest ten merges.
    pulls: [closedPull(13, null), ...Array.from({ length: 12 }, (_, index) => closedPull(12 - index, `2026-11-${String(20 - index).padStart(2, "0")}T10:00:00Z`))],
    // A draft and six published releases: the history shows the latest five.
    releases: [
      publishedRelease("v2.0.0", null),
      publishedRelease("v1.6.0-rc.1", "2026-11-19T12:00:00Z", { prerelease: true }),
      ...["v1.5.0", "v1.4.0", "v1.3.0", "v1.2.0", "v1.1.0"].map((tag, index) => publishedRelease(tag, `2026-11-${String(15 - index * 2).padStart(2, "0")}T12:00:00Z`)),
    ],
    runs: [
      workflowRun("quality-review", "failure", "2026-11-20T11:00:00Z"),
      workflowRun("ci", "failure", "2026-11-20T10:00:00Z"),
      workflowRun("quality-review", "success", "2026-11-19T11:00:00Z"),
      workflowRun("ci", "success", "2026-11-19T10:00:00Z"),
    ],
    doctorRuns: [doctorRun(111, "completed", "failure")],
    annotations: {
      "111": [
        { title: "context-doctor failure codes", message: "roadmap-left (1), archive-unstamped (3)", path: ".github" },
        { title: "roadmap-left", message: "The roadmap is left after its archive.", path: "context/foundation/roadmap.md" },
        { title: "archive-unstamped", message: "The archived change is not stamped.", path: "context/archive/2026-11-02-history-search/change.md" },
      ],
    },
  },
  {
    fullName: "example-org/history-refused-app",
    hasState: true,
    // Releases and check runs are refused; merges and runs still read.
    refused: { "/releases": "contents=read", "/commits/main/check-runs": "checks=read" },
    state: createStateFixture({ project: "history-refused-app", owner_queue: [] }),
  },
];

const FAKE_REPOSITORIES: readonly FakeRepository[] = [
  { fullName: "example-org/alpha-app", hasState: true, refused: {} },
  // The broadcast e2e: two projects with the owner-word label and one without.
  { fullName: "example-org/herald-app", hasState: true, refused: {} },
  { fullName: "example-org/herald-web", hasState: true, refused: {} },
  { fullName: "example-org/herald-docs", hasState: true, refused: {}, noOwnerWordLabel: true },
  { fullName: "example-org/beta-app", hasState: false, refused: {} },
  { fullName: "example-org/gamma-app", hasState: true, refused: { "/contents/context/state.json": "contents=read" } },
  { fullName: "example-org/delta-app", hasState: true, refused: { "/actions/runs": "actions=read" } },
  { fullName: "example-org/zeta-app", hasState: true, refused: {} },
  // Only the repository picker spec adds it, so it is offered until that spec picks it.
  { fullName: "example-org/zeta-picker-app", hasState: true, refused: {} },
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
  {
    fullName: "example-org/teamwork-app",
    hasState: true,
    refused: {},
    state: createStateFixture({
      project: "teamwork-app",
      owner_queue: [
        { id: "oq-teamwork-1", kind: "decision", source: "context/foundation/roadmap.md", item: "TW-1", since: "2026-11-07", text: "Approve the teamwork-app onboarding copy" },
      ],
    }),
  },
  {
    fullName: "example-org/sigma-app",
    hasState: true,
    refused: {},
    state: createStateFixture({
      project: "sigma-app",
      owner_queue: [
        { id: "oq-sigma-1", kind: "decision", source: "context/foundation/roadmap.md", item: "SG-3", since: "2026-11-04", text: "Choose the sigma-app storage plan" },
        { id: "oq-sigma-2", kind: "word", source: "context/foundation/roadmap.md", item: null, since: "2026-11-09", text: "Release sigma-app after SG-3" },
      ],
    }),
  },
  {
    fullName: "example-org/tau-app",
    hasState: true,
    refused: {},
    state: createStateFixture({
      project: "tau-app",
      owner_queue: [
        { id: "oq-tau-1", kind: "decision", source: "context/foundation/roadmap.md", item: "TA-2", since: "2026-11-05", text: "Pick the tau-app search engine" },
      ],
    }),
  },
  {
    fullName: "example-org/terminal-app",
    hasState: true,
    refused: {},
    state: createStateFixture({
      project: "terminal-app",
      active_roadmap: { slug: "terminal-v1", title: "Terminal v1", status: "ready", version: "1", path: "context/foundation/roadmap.md", done: 2, total: 5, items: [] },
      owner_queue: [
        { id: "oq-terminal-1", kind: "step", source: "context/foundation/roadmap.md", item: "TM-4", since: "2026-11-05", text: "Confirm the terminal-app export columns" },
      ],
    }),
  },
  ...OVERVIEW_REPOSITORIES,
  ...PROJECT_PAGE_REPOSITORIES,
  ...HISTORY_REPOSITORIES,
  ...HEALTH_REPOSITORIES,
  ...DEPLOY_REPOSITORIES,
  ...HARBOR_REPOSITORIES,
  ...WAKE_REPOSITORIES,
];

const createdIssues = new Map<string, CreatedIssue[]>();
/** How often each repository's state was served (refuseStateAfterReads). */
const stateReads = new Map<string, number>();

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
  if (url.pathname === "/user/repos") {
    // Every fixture fits on the first page; later pages are empty.
    const page = Number(url.searchParams.get("page") ?? "1");
    send(response, 200, page > 1 ? [] : FAKE_REPOSITORIES.map((repository) => ({ full_name: repository.fullName, archived: false })));
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
  } else if (rest === "/contents/context/state.json" && (stateReads.get(repository.fullName) ?? 0) >= (repository.refuseStateAfterReads ?? Infinity)) {
    send(response, 403, { message: "Resource not accessible by personal access token" }, { "x-accepted-github-permissions": "contents=read" });
  } else if (rest === "/contents/context/state.json") {
    stateReads.set(repository.fullName, (stateReads.get(repository.fullName) ?? 0) + 1);
    const state = repository.state ?? createStateFixture({ project: repository.fullName.split("/")[1] ?? "project" });
    send(response, repository.hasState ? 200 : 404, repository.hasState ? state : { message: "Not Found" });
  } else if (rest === "/contents/context/workflow.json") {
    send(response, repository.workflowFile === undefined ? 404 : 200, repository.workflowFile ?? { message: "Not Found" });
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
    send(response, 200, repository.pulls ?? []);
  } else if (rest === "/releases") {
    send(response, 200, repository.releases ?? []);
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
  } else if (rest === "/actions/workflows/deploy.yml/runs" && repository.deployRuns !== undefined) {
    send(response, 200, { total_count: repository.deployRuns.length, workflow_runs: repository.deployRuns });
  } else if (rest.startsWith("/contents/") && repository.filesAtRef?.[url.searchParams.get("ref") ?? ""]?.[decodeURIComponent(rest.slice("/contents/".length))] !== undefined) {
    const text = repository.filesAtRef?.[url.searchParams.get("ref") ?? ""]?.[decodeURIComponent(rest.slice("/contents/".length))] ?? "";
    send(response, 200, { type: "file", encoding: "base64", content: Buffer.from(text, "utf8").toString("base64") });
  } else if (rest.startsWith("/compare/") && repository.compare?.[decodeURIComponent(rest.slice("/compare/".length))] !== undefined) {
    send(response, 200, repository.compare?.[decodeURIComponent(rest.slice("/compare/".length))]);
  } else if (rest.startsWith("/contents/") && repository.files?.[decodeURIComponent(rest.slice("/contents/".length))] !== undefined) {
    const text = repository.files?.[decodeURIComponent(rest.slice("/contents/".length))] ?? "";
    send(response, 200, { type: "file", encoding: "base64", content: Buffer.from(text, "utf8").toString("base64") });
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
