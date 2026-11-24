import { describe, expect, it } from "vitest";
import type { StoredForgeFacts } from "../../modules/overview/facts.ts";
import type { ProjectRead } from "../../modules/projects/reads.ts";
import { buildOverview, countUnansweredByProject, type OverviewRow } from "../../src/overview/build-overview.ts";
import { createStateFixture } from "../support/state-fixture.ts";

const NOW = new Date("2026-11-10T12:00:00Z");
const READ_AT = new Date("2026-11-10T11:30:00Z");

function read(key: string, state: unknown, status: ProjectRead["status"] = "ok"): ProjectRead {
  return { key, status, issuesStatus: "ok", state, issues: [], readAt: READ_AT, lastGoodAt: state === null ? null : READ_AT };
}

function facts(key: string, overrides: Partial<StoredForgeFacts> = {}): StoredForgeFacts {
  return { key, release: null, releaseStatus: "ok", ciRun: null, qualityReviewRun: null, runsStatus: "ok", doctor: { kind: "ok", url: null }, doctorStatus: "ok", readAt: READ_AT, ...overrides };
}

const PASSED_CI = { result: "passed", url: "https://forge.example.test/run/1", at: "2026-11-10T10:00:00Z" };
const FAILED_CI = { result: "failed", url: "https://forge.example.test/run/2", at: "2026-11-10T10:00:00Z" };

const STATES = {
  "example-org/alpha-app": createStateFixture({
    updated_at: "2026-11-10T09:00:00Z",
    queued: [{ slug: "alpha-v2", title: null, status: null, path: "context/foundation/roadmaps/alpha-v2.md", start_condition: null, done: 0, total: 2, items: [] }],
    open_changes: [{ change_id: "second-screen", title: null, status: "implementing", roadmap_item: "AL-2", updated: null, stage: null }],
    last_release: { version: "v0.3.0", date: "2026-10-01", source: "roadmap" },
  }),
  "example-org/beta-app": createStateFixture({ project: "beta-app", owner_queue: [], updated_at: "2026-11-01T09:00:00Z" }),
  "example-org/gamma-app": createStateFixture({
    project: "gamma-app",
    owner_queue: [],
    active_roadmap: null,
    last_release: { version: "v1.2.0", date: "2026-09-12", source: "roadmap" },
  }),
  "example-org/delta-app": createStateFixture({ project: "delta-app", owner_queue: [], updated_at: "2026-11-10T08:00:00Z" }),
} as const;

/**
 * What `npx softure-skills portfolio --json --source api` (@softure-ai/skills 0.24.0) prints for the same fictional
 * projects: the state from each repository and the last release from the forge first, else the roadmap's.
 */
const PORTFOLIO = [
  { name: "alpha-app", roadmap: "alpha-v1 1/3", queued: 1, open_changes: 1, owner_queue: 1, last_release: "v0.4.1", last_release_date: "2026-11-03", last_release_source: "release" },
  { name: "beta-app", roadmap: "alpha-v1 1/3", queued: 0, open_changes: 0, owner_queue: 0, last_release: null, last_release_date: null, last_release_source: null },
  { name: "delta-app", roadmap: "alpha-v1 1/3", queued: 0, open_changes: 0, owner_queue: 0, last_release: null, last_release_date: null, last_release_source: null },
  { name: "gamma-app", roadmap: "—", queued: 0, open_changes: 0, owner_queue: 0, last_release: "v1.2.0", last_release_date: "2026-09-12", last_release_source: "roadmap" },
];

function buildFixtureOverview() {
  const keys = Object.keys(STATES);
  return buildOverview({
    projects: [...keys, "example-org/epsilon-app"].map((key) => ({ key, fullName: key })),
    reads: [...keys.map((key) => read(key, STATES[key as keyof typeof STATES])), read("example-org/epsilon-app", null, "no_state")],
    facts: [
      facts("example-org/alpha-app", { release: { version: "v0.4.1", date: "2026-11-03" }, ciRun: PASSED_CI }),
      facts("example-org/beta-app", { ciRun: PASSED_CI }),
      facts("example-org/gamma-app"),
      facts("example-org/delta-app", { ciRun: FAILED_CI, runsStatus: "ok" }),
    ],
    unansweredByKey: new Map([["example-org/alpha-app", 1]]),
    now: NOW,
  });
}

function rowsByName(rows: readonly OverviewRow[]): Record<string, OverviewRow> {
  return Object.fromEntries(rows.map((row) => [row.fullName.split("/")[1] ?? "", row]));
}

describe("buildOverview", () => {
  it("reports every number as portfolio --json does for the same projects", () => {
    const rows = rowsByName(buildFixtureOverview().groups.flatMap((group) => group.rows));
    for (const expected of PORTFOLIO) {
      const row = rows[expected.name];
      const roadmap = row?.numbers?.activeRoadmap;
      expect({
        name: expected.name,
        roadmap: roadmap === null || roadmap === undefined ? "—" : `${roadmap.slug ?? "?"} ${String(roadmap.done)}/${String(roadmap.total)}`,
        queued: row?.numbers?.queued,
        open_changes: row?.numbers?.openChanges,
        owner_queue: row?.numbers?.waiting,
        last_release: row?.release?.version ?? null,
        last_release_date: row?.release?.date ?? null,
        last_release_source: row?.release?.source ?? null,
      }).toEqual(expected);
    }
  });

  it("gives each project its status and groups them broken first, idle last", () => {
    const overview = buildFixtureOverview();
    expect(overview.groups.map((group) => [group.status, group.rows.map((row) => row.fullName)])).toEqual([
      ["broken", ["example-org/delta-app", "example-org/epsilon-app"]],
      ["waiting", ["example-org/alpha-app"]],
      ["stalled", ["example-org/beta-app"]],
      ["idle", ["example-org/gamma-app"]],
    ]);
    const rows = rowsByName(overview.groups.flatMap((group) => group.rows));
    expect(rows["delta-app"]?.brokenReasons).toEqual(["ci_failed"]);
    expect(rows["epsilon-app"]).toMatchObject({ brokenReasons: ["state_unreadable"], readStatus: "no_state", numbers: null, ci: { kind: "not_read" } });
    expect(overview.statusByKey.get("example-org/gamma-app")).toBe("idle");
  });

  it("does not show a project broken before its first read", () => {
    const overview = buildOverview({
      projects: [{ key: "example-org/zeta-app", fullName: "example-org/zeta-app" }],
      reads: [],
      facts: [],
      unansweredByKey: new Map(),
      now: NOW,
    });
    const row = overview.groups.flatMap((group) => group.rows)[0];
    expect(row).toMatchObject({ status: "idle", brokenReasons: [], readStatus: "never", numbers: null });
    expect(overview.statusByKey.get("example-org/zeta-app")).toBe("idle");
  });

  it("shows a project moving when its open work changed within 48 hours", () => {
    const overview = buildOverview({
      projects: [{ key: "example-org/alpha-app", fullName: "example-org/alpha-app" }],
      reads: [read("example-org/alpha-app", { ...STATES["example-org/alpha-app"], owner_queue: [] })],
      facts: [],
      unansweredByKey: new Map(),
      now: NOW,
    });
    expect(overview.groups.map((group) => group.status)).toEqual(["moving"]);
  });

  it("says why runs are missing: none, not readable, or not read yet", () => {
    const overview = buildOverview({
      projects: ["a", "b", "c"].map((name) => ({ key: `example-org/${name}`, fullName: `example-org/${name}` })),
      reads: ["a", "b", "c"].map((name) => read(`example-org/${name}`, STATES["example-org/gamma-app"])),
      facts: [facts("example-org/a"), facts("example-org/b", { runsStatus: "not_readable" })],
      unansweredByKey: new Map(),
      now: NOW,
    });
    const rows = rowsByName(overview.groups.flatMap((group) => group.rows));
    expect([rows.a?.ci, rows.b?.ci, rows.c?.ci, rows.a?.qualityReview]).toEqual([
      { kind: "none" },
      { kind: "not_readable" },
      { kind: "not_read" },
      { kind: "none" },
    ]);
  });

  it("shows each doctor result as portfolio reads it, and a failing doctor makes the project broken", () => {
    const failing = { kind: "failing", url: "https://forge.example.test/doctor/3", codes: [{ code: "roadmap.stale", count: 2 }] };
    const names = ["ok", "failing", "pending", "missing", "refused", "unread", "garbled"];
    const overview = buildOverview({
      projects: names.map((name) => ({ key: `example-org/${name}`, fullName: `example-org/${name}` })),
      reads: names.map((name) => read(`example-org/${name}`, STATES["example-org/gamma-app"])),
      facts: [
        facts("example-org/ok"),
        facts("example-org/failing", { doctor: failing }),
        facts("example-org/pending", { doctor: { kind: "pending", url: null } }),
        facts("example-org/missing", { doctor: { kind: "missing" } }),
        facts("example-org/refused", { doctor: null, doctorStatus: "not_readable" }),
        facts("example-org/garbled", { doctor: { kind: "failing", codes: "many" }, doctorStatus: "ok" }),
      ],
      unansweredByKey: new Map(),
      now: NOW,
    });
    const rows = rowsByName(overview.groups.flatMap((group) => group.rows));
    expect(names.map((name) => rows[name]?.doctor)).toEqual([
      { kind: "ok", url: null },
      failing,
      { kind: "pending", url: null },
      { kind: "missing" },
      { kind: "not_readable" },
      { kind: "not_read" },
      { kind: "not_read" },
    ]);
    expect(rows.failing).toMatchObject({ status: "broken", brokenReasons: ["doctor_failing"] });
    expect(names.filter((name) => name !== "failing").map((name) => rows[name]?.status)).toEqual(Array.from({ length: 6 }, () => "idle"));
  });

  it("shows health only for projects with a source, and an unhealthy one is broken (FR-17)", () => {
    const names = ["none", "absent", "healthy", "unhealthy", "unknown", "odd-reason", "garbled", "other-adapter"];
    const at = { readAt: READ_AT };
    const overview = buildOverview({
      projects: names.map((name) => ({ key: `example-org/${name}`, fullName: `example-org/${name}` })),
      reads: names.map((name) => read(`example-org/${name}`, STATES["example-org/gamma-app"])),
      facts: names.map((name) => facts(`example-org/${name}`)),
      adapterReads: [
        { key: "example-org/absent", adapter: "observability", status: "absent", ...at },
        { key: "example-org/healthy", adapter: "observability", status: "value", value: { kind: "healthy", rules: 3 }, ...at },
        { key: "example-org/unhealthy", adapter: "observability", status: "value", value: { kind: "unhealthy", firing: ["Silent", "Errors"] }, ...at },
        { key: "example-org/unknown", adapter: "observability", status: "unknown", reason: "backend_unavailable", ...at },
        { key: "example-org/odd-reason", adapter: "observability", status: "unknown", reason: "from-the-future", ...at },
        { key: "example-org/garbled", adapter: "observability", status: "value", value: { kind: "unhealthy", firing: [] }, ...at },
        { key: "example-org/other-adapter", adapter: "deploy", status: "value", value: { version: "v1" }, ...at },
      ],
      unansweredByKey: new Map(),
      now: NOW,
    });
    const rows = rowsByName(overview.groups.flatMap((group) => group.rows));
    expect(names.map((name) => rows[name]?.health)).toEqual([
      { kind: "none" },
      { kind: "none" },
      { kind: "healthy", rules: 3 },
      { kind: "unhealthy", firing: ["Silent", "Errors"] },
      { kind: "unknown", reason: "backend_unavailable" },
      { kind: "unknown", reason: "other" },
      { kind: "unknown", reason: "other" },
      { kind: "none" },
    ]);
    expect(rows.unhealthy).toMatchObject({ status: "broken", brokenReasons: ["unhealthy"] });
    expect(names.filter((name) => name !== "unhealthy").map((name) => rows[name]?.status)).toEqual(Array.from({ length: 7 }, () => "idle"));
  });

  it("shows what wakes each project on an owner-word issue, without changing its status (CV-2)", () => {
    const names = ["routine", "heartbeat", "nothing", "no-workflow", "invalid"];
    const at = { readAt: READ_AT };
    const overview = buildOverview({
      projects: names.map((name) => ({ key: `example-org/${name}`, fullName: `example-org/${name}` })),
      reads: names.map((name) => read(`example-org/${name}`, STATES["example-org/gamma-app"])),
      facts: names.map((name) => facts(`example-org/${name}`)),
      adapterReads: [
        { key: "example-org/routine", adapter: "wake", status: "value", value: { wake: "routine" }, ...at },
        { key: "example-org/heartbeat", adapter: "wake", status: "value", value: { wake: "heartbeat" }, ...at },
        { key: "example-org/nothing", adapter: "wake", status: "value", value: { wake: "undeclared" }, ...at },
        { key: "example-org/no-workflow", adapter: "wake", status: "absent", ...at },
        { key: "example-org/invalid", adapter: "wake", status: "unknown", reason: "wake_invalid", ...at },
      ],
      unansweredByKey: new Map(),
      now: NOW,
    });
    const rows = rowsByName(overview.groups.flatMap((group) => group.rows));
    expect(names.map((name) => rows[name]?.wake)).toEqual([
      { kind: "declared", wake: "routine" },
      { kind: "declared", wake: "heartbeat" },
      { kind: "declared", wake: "undeclared" },
      { kind: "none" },
      { kind: "unknown", reason: "wake_invalid" },
    ]);
    expect(names.map((name) => rows[name]?.status)).toEqual(Array.from({ length: 5 }, () => "idle"));
  });

  it("keeps a project broken while its latest read fails, showing the last good numbers", () => {
    const overview = buildOverview({
      projects: [{ key: "example-org/beta-app", fullName: "example-org/beta-app" }],
      reads: [read("example-org/beta-app", STATES["example-org/beta-app"], "unavailable")],
      facts: [],
      unansweredByKey: new Map(),
      now: NOW,
    });
    const row = overview.groups[0]?.rows[0];
    expect(row).toMatchObject({ status: "broken", readStatus: "unavailable", numbers: { queued: 0, openChanges: 0, waiting: 0 } });
  });

  it("builds 30 projects with 200 entries well under the page budget", () => {
    const keys = Array.from({ length: 30 }, (_, index) => `example-org/app-${String(index)}`);
    const entries = Array.from({ length: 7 }, (_, index) => ({ id: `oq-${String(index)}`, kind: "decision" as const, source: "context/foundation/roadmap.md", item: null, since: "2026-11-01", text: "Decide" }));
    const started = performance.now();
    const overview = buildOverview({
      projects: keys.map((key) => ({ key, fullName: key })),
      reads: keys.map((key) => read(key, createStateFixture({ owner_queue: entries }))),
      facts: keys.map((key) => facts(key, { ciRun: PASSED_CI })),
      unansweredByKey: new Map(keys.map((key) => [key, 7])),
      now: NOW,
    });
    expect(performance.now() - started).toBeLessThan(50);
    expect(overview.groups.flatMap((group) => group.rows)).toHaveLength(30);
  });
});

describe("buildOverview CI from the last merged pull request (CT-7)", () => {
  const project = { key: "example-org/alpha-app", fullName: "example-org/alpha-app" };
  const build = (ciRun: unknown) =>
    buildOverview({ projects: [project], reads: [read(project.key, STATES["example-org/alpha-app"])], facts: [facts(project.key, { ciRun })], unansweredByKey: new Map(), now: NOW })
      .groups.flatMap((group) => group.rows)[0];

  it("carries the pull request a CI result comes from, and marks a failed one broken", () => {
    const row = build({ ...FAILED_CI, pullRequest: { number: 12, url: "https://forge.example.test/pull/12" } });
    expect(row?.ci).toEqual({ kind: "run", ...FAILED_CI, pullRequest: { number: 12, url: "https://forge.example.test/pull/12" } });
    expect(row?.brokenReasons).toContain("ci_failed");
  });

  it("reads a run stored before CT-7 as one from the main branch", () => {
    expect(build(PASSED_CI)?.ci).toEqual({ kind: "run", ...PASSED_CI, pullRequest: null });
  });
});

describe("countUnansweredByProject", () => {
  it("counts only open entries per project", () => {
    expect(
      countUnansweredByProject([
        { projectKey: "a", answer: { kind: "open" } },
        { projectKey: "a", answer: { kind: "sent" } },
        { projectKey: "b", answer: { kind: "open" } },
        { projectKey: "b", answer: { kind: "open" } },
      ]),
    ).toEqual(new Map([["a", 1], ["b", 2]]));
  });

  it("is empty for an empty inbox", () => {
    expect(countUnansweredByProject([])).toEqual(new Map());
  });
});

describe("buildOverview context drift (CT-3)", () => {
  type Item = NonNullable<ReturnType<typeof createStateFixture>["active_roadmap"]>["items"][number];
  const item = (id: string, status: string, detail: string | null = null, since: string | null = null): Item => ({
    id,
    change_id: null,
    outcome: null,
    status,
    stage: null,
    since,
    detail,
    prerequisites: [],
    mode: "autonomous",
  });
  const roadmapOf = (items: Item[]) => ({ slug: "kappa-v1", title: null, status: null, version: null, path: "context/foundation/roadmap.md", done: 0, total: items.length, items });

  it("flags the released-but-not-settled and the finished-but-live projects and leaves the settled one clean", () => {
    const states = {
      "example-org/kappa-settled": createStateFixture({ owner_queue: [], active_roadmap: roadmapOf([item("KA-1", "done"), item("KA-2", "ready")]) }),
      "example-org/kappa-released": createStateFixture({
        owner_queue: [],
        active_roadmap: roadmapOf([item("KA-1", "done_code", "2026-11-02; waiting: release", "2026-11-02"), item("KA-2", "ready")]),
      }),
      "example-org/kappa-finished": createStateFixture({ owner_queue: [], active_roadmap: roadmapOf([item("KA-1", "done"), item("KA-2", "done")]) }),
    };
    const keys = Object.keys(states) as (keyof typeof states)[];
    const overview = buildOverview({
      projects: keys.map((key) => ({ key, fullName: key })),
      reads: keys.map((key) => read(key, states[key])),
      facts: keys.map((key) => facts(key, { release: { version: "v1.1.0", date: "2026-11-05" } })),
      unansweredByKey: new Map(),
      now: NOW,
    });
    const drift = Object.fromEntries(overview.groups.flatMap((group) => group.rows).map((row) => [row.fullName, row.drift.map((one) => one.kind)]));
    expect(drift).toEqual({
      "example-org/kappa-settled": [],
      "example-org/kappa-released": ["release_not_settled"],
      "example-org/kappa-finished": ["finished_roadmap_live"],
    });
  });
});
