// The overview (FR-7): one row per watched project with its status (FR-8) and the numbers behind it, as
// `npx softure-skills portfolio --json` reports them (last release from the forge first, the doctor from its
// `context-doctor` check run), grouped by status.
import { z } from "zod";
import type { StoredAdapterRead } from "../../modules/adapters/reads.ts";
import type { StoredForgeFacts } from "../../modules/overview/facts.ts";
import type { ProjectRead, ReadStatus } from "../../modules/projects/reads.ts";
import { getHealthView, type HealthView } from "../adapters/observability/health-view.ts";
import { getWakeView, type WakeView } from "../adapters/wake/wake-view.ts";
import type { DoctorResult } from "../doctor/read-doctor.ts";
import { findContextDrift, type ContextDrift } from "../drift/find-context-drift.ts";
import type { RunResult } from "../forge/runs.ts";
import { getProjectStatus, PROJECT_STATUSES, type BrokenReason, type ProjectStatus } from "../status/project-status.ts";

export interface OverviewRelease {
  readonly version: string;
  readonly date: string | null;
  /** `release` from the forge, `roadmap` from the state a closed roadmap recorded (portfolio's labels). */
  readonly source: "release" | "roadmap";
}

/** The pull request a CI result comes from, when the main branch has no CI run of its own (CT-7). */
export interface OverviewRunPullRequest {
  readonly number: number;
  readonly url: string;
}

export type OverviewRun =
  | {
      readonly kind: "run";
      readonly result: RunResult;
      readonly url: string;
      readonly at: string;
      /** Null for a run on the main branch. */
      readonly pullRequest: OverviewRunPullRequest | null;
    }
  | { readonly kind: "none" }
  | { readonly kind: "not_readable" }
  | { readonly kind: "not_read" };

export type OverviewDoctor = DoctorResult | { readonly kind: "not_readable" } | { readonly kind: "not_read" };

export interface OverviewRow {
  readonly key: string;
  readonly fullName: string;
  readonly status: ProjectStatus;
  readonly brokenReasons: readonly BrokenReason[];
  readonly readStatus: ReadStatus | "never";
  readonly readAt: Date | null;
  /** Null when the project has no state read yet. */
  readonly numbers: OverviewNumbers | null;
  readonly release: OverviewRelease | null;
  readonly ci: OverviewRun;
  readonly qualityReview: OverviewRun;
  readonly doctor: OverviewDoctor;
  /** Health from the project's observability backend (FR-17); `none` when it has no such source. */
  readonly health: HealthView;
  /** What wakes the project on an owner-word issue (CV-2); `none` when it has no workflow file. */
  readonly wake: WakeView;
  /** The context's drift against the forge (CT-3); empty when the context is settled. */
  readonly drift: readonly ContextDrift[];
}

export interface OverviewNumbers {
  /** Null when the project has no active roadmap. */
  readonly activeRoadmap: { readonly slug: string | null; readonly title: string | null; readonly done: number; readonly total: number } | null;
  readonly queued: number;
  readonly openChanges: number;
  /** Every owner-queue entry, as portfolio counts it. */
  readonly waiting: number;
  readonly unanswered: number;
}

export interface OverviewGroup {
  readonly status: ProjectStatus;
  readonly rows: readonly OverviewRow[];
}

export interface Overview {
  readonly groups: readonly OverviewGroup[];
  readonly statusByKey: ReadonlyMap<string, ProjectStatus>;
}

export interface OverviewProject {
  readonly key: string;
  readonly fullName: string;
}

export interface BuildOverviewInput {
  readonly projects: readonly OverviewProject[];
  readonly reads: readonly ProjectRead[];
  readonly facts: readonly StoredForgeFacts[];
  /** What the optional adapters last read (FR-17); none when no adapter ran. */
  readonly adapterReads?: readonly StoredAdapterRead[];
  /** Unanswered owner-queue entries per project key, as the inbox counts them. */
  readonly unansweredByKey: ReadonlyMap<string, number>;
  readonly now: Date;
}

// The stored state was valid when written; it is read defensively all the same.
const storedStateSchema = z.object({
  updated_at: z.string(),
  active_roadmap: z.object({ slug: z.string().nullable(), title: z.string().nullable(), done: z.number(), total: z.number() }).nullable(),
  queued: z.array(z.unknown()),
  open_changes: z.array(z.unknown()),
  owner_queue: z.array(z.unknown()),
  last_release: z.object({ version: z.string(), date: z.string().nullable() }).nullable(),
});
type StoredState = z.infer<typeof storedStateSchema>;

const storedReleaseSchema = z.object({ version: z.string(), date: z.string().nullable() });
const storedRunSchema = z.object({
  result: z.enum(["passed", "failed", "cancelled", "running"]),
  url: z.string(),
  at: z.string(),
  // Absent in rows stored before CT-7.
  pullRequest: z.object({ number: z.number().int(), url: z.string() }).nullable().optional(),
});
const storedDoctorSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("ok"), url: z.string().nullable() }),
  z.object({
    kind: z.literal("failing"),
    url: z.string().nullable(),
    codes: z.array(z.object({ code: z.string(), count: z.number().int().positive() })).nullable(),
  }),
  z.object({ kind: z.literal("pending"), url: z.string().nullable() }),
  z.object({ kind: z.literal("missing") }),
]);

function toRelease(facts: StoredForgeFacts | undefined, state: StoredState | null): OverviewRelease | null {
  const forge = storedReleaseSchema.safeParse(facts?.release);
  if (forge.success) {
    return { ...forge.data, source: "release" };
  }
  return state?.last_release ? { ...state.last_release, source: "roadmap" } : null;
}

function toRun(facts: StoredForgeFacts | undefined, stored: unknown): OverviewRun {
  if (facts === undefined) {
    return { kind: "not_read" };
  }
  const run = storedRunSchema.safeParse(stored);
  if (run.success) {
    const { pullRequest, ...rest } = run.data;
    return { kind: "run", ...rest, pullRequest: pullRequest ?? null };
  }
  if (facts.runsStatus === "not_readable") {
    return { kind: "not_readable" };
  }
  return facts.runsStatus === "ok" ? { kind: "none" } : { kind: "not_read" };
}

function toDoctor(facts: StoredForgeFacts | undefined): OverviewDoctor {
  if (facts === undefined) {
    return { kind: "not_read" };
  }
  const doctor = storedDoctorSchema.safeParse(facts.doctor);
  if (doctor.success) {
    return doctor.data;
  }
  return facts.doctorStatus === "not_readable" ? { kind: "not_readable" } : { kind: "not_read" };
}

function toNumbers(state: StoredState, unanswered: number): OverviewNumbers {
  return {
    activeRoadmap: state.active_roadmap,
    queued: state.queued.length,
    openChanges: state.open_changes.length,
    waiting: state.owner_queue.length,
    unanswered,
  };
}

function hasOpenWork(numbers: OverviewNumbers): boolean {
  const roadmap = numbers.activeRoadmap;
  return (roadmap !== null && roadmap.done < roadmap.total) || numbers.openChanges > 0;
}

function toDate(value: string): Date | null {
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : new Date(time);
}

function buildRow(input: BuildOverviewInput, project: OverviewProject, read: ProjectRead | undefined, facts: StoredForgeFacts | undefined): OverviewRow {
  const parsed = storedStateSchema.safeParse(read?.state);
  const state = parsed.success ? parsed.data : null;
  const numbers = state === null ? null : toNumbers(state, input.unansweredByKey.get(project.key) ?? 0);
  const ci = toRun(facts, facts?.ciRun);
  const doctor = toDoctor(facts);
  const health = getHealthView(input.adapterReads ?? [], project.key);
  const { status, brokenReasons } = getProjectStatus(
    {
      // A project not read yet has no failed read to report: only a read that happened can make the state unreadable.
      isStateRead: read === undefined || (read.status === "ok" && state !== null),
      hasCiFailed: ci.kind === "run" && ci.result === "failed",
      hasDoctorFailed: doctor.kind === "failing",
      isUnhealthy: health.kind === "unhealthy",
      unansweredCount: numbers?.unanswered ?? 0,
      hasOpenWork: numbers !== null && hasOpenWork(numbers),
      stateUpdatedAt: state === null ? null : toDate(state.updated_at),
    },
    input.now,
  );
  return {
    key: project.key,
    fullName: project.fullName,
    status,
    brokenReasons,
    readStatus: read?.status ?? "never",
    readAt: read?.readAt ?? null,
    numbers,
    release: toRelease(facts, state),
    ci,
    qualityReview: toRun(facts, facts?.qualityReviewRun),
    doctor,
    health,
    wake: getWakeView(input.adapterReads ?? [], project.key),
    drift: findContextDrift({ state: read?.state, release: facts?.release }),
  };
}

export function buildOverview(input: BuildOverviewInput): Overview {
  const readsByKey = new Map(input.reads.map((read) => [read.key, read]));
  const factsByKey = new Map(input.facts.map((facts) => [facts.key, facts]));
  const rows = input.projects
    .map((project) => buildRow(input, project, readsByKey.get(project.key), factsByKey.get(project.key)))
    .sort((left, right) => left.fullName.localeCompare(right.fullName));
  const groups = PROJECT_STATUSES.map((status) => ({ status, rows: rows.filter((row) => row.status === status) })).filter(
    (group) => group.rows.length > 0,
  );
  return { groups, statusByKey: new Map(rows.map((row) => [row.key, row.status])) };
}

/** Unanswered entries per project key, from the inbox's rows. */
export function countUnansweredByProject(rows: readonly { readonly projectKey: string; readonly answer: { readonly kind: string } }[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (row.answer.kind === "open") {
      counts.set(row.projectKey, (counts.get(row.projectKey) ?? 0) + 1);
    }
  }
  return counts;
}
