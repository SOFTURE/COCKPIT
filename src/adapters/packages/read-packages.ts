// The packages adapter's read (CT-1). Forge reads only (Pull requests, Actions and Contents read, NFR-5), nothing
// written (NFR-7): the routine's newest pull request and, while it is open, the Actions runs at its head (a
// fine-grained token cannot read check runs, SOFTURE/SKILLS#68); `context/workflow.json` for the held packages;
// `package.json` and `package-lock.json` for the `@softure-ai/*` versions. The newest versions come from the npm
// registry. Each part fails on its own; a forge rate limit stops the scan.
import { z } from "zod";
import type { ForgeClient, ForgeRead } from "../../forge/client.ts";
import { getRunJobs, summarizeRun } from "../../forge/runs.ts";
import type { AdapterContext, AdapterProject, AdapterRead } from "../contract.ts";
import type { NpmRegistry } from "./npm-registry.ts";
import {
  KEY_PACKAGES,
  PACKAGE_SCOPE,
  UPDATE_BRANCH_PREFIX,
  UPDATE_TITLE_PATTERN,
  type HeldPackage,
  type PackagesState,
  type PackageUpdate,
  type PackageVersion,
  type UpdateChecks,
} from "./packages-state.ts";

/** Pull requests read per project and scan to find the routine's newest one: one page, newest first. */
export const PULLS_READ = 50;
/** Runs read at an open update's head: one page. */
const HEAD_RUNS_READ = 100;

const WORKFLOW_FILE = "context/workflow.json";
const MANIFEST_FILE = "package.json";
const LOCKFILE = "package-lock.json";

const pullSchema = z.object({
  number: z.number().int(),
  title: z.string(),
  state: z.string(),
  html_url: z.url({ protocol: /^https?$/ }),
  created_at: z.string(),
  merged_at: z.string().nullable().optional(),
  head: z.object({ ref: z.string(), sha: z.string() }).loose(),
});
type ForgePull = z.infer<typeof pullSchema>;

const headRunsSchema = z.object({
  workflow_runs: z.array(
    z.object({
      id: z.number().int(),
      name: z.string().nullable().optional(),
      status: z.string().nullable(),
      conclusion: z.string().nullable(),
      html_url: z.string(),
      created_at: z.string(),
    }),
  ),
});

const workflowSchema = z
  .object({
    routines: z
      .object({
        packageUpdates: z.object({ hold: z.array(z.unknown()).optional() }).loose().optional(),
      })
      .loose()
      .optional(),
  })
  .loose();

const holdEntrySchema = z.object({
  package: z.string().min(1),
  issue: z.union([z.string(), z.number()]).nullable().optional(),
  since: z.string().nullable().optional(),
});

const manifestSchema = z
  .object({
    dependencies: z.record(z.string(), z.unknown()).optional(),
    devDependencies: z.record(z.string(), z.unknown()).optional(),
  })
  .loose();

const lockfileSchema = z.object({ packages: z.record(z.string(), z.object({ version: z.string().optional() }).loose()).optional() }).loose();

type RateLimited = { readonly status: "rate_limited"; readonly retryAfterSeconds: number | null };

const FAILED_CONCLUSIONS = new Set(["failure", "timed_out", "startup_failure"]);

function isRateLimited<T>(value: T | RateLimited): value is RateLimited {
  return typeof value === "object" && value !== null && "status" in value && value.status === "rate_limited";
}

/** A forge failure that stops the scan, or null for one the part shows on its own. */
function getRateLimit(read: ForgeRead<unknown>): RateLimited | null {
  return !read.ok && read.kind === "rate_limited" ? { status: "rate_limited", retryAfterSeconds: read.retryAfterSeconds } : null;
}

function repositoryPath(project: AdapterProject): string {
  return `/repos/${encodeURIComponent(project.owner)}/${encodeURIComponent(project.name)}`;
}

function isUpdatePull(pull: ForgePull): boolean {
  return UPDATE_TITLE_PATTERN.test(pull.title) || pull.head.ref.startsWith(UPDATE_BRANCH_PREFIX);
}

interface HeadChecks {
  readonly checks: UpdateChecks;
  readonly failingCheck: string | null;
}

async function getHeadChecks(client: ForgeClient, project: AdapterProject, sha: string): Promise<HeadChecks | RateLimited> {
  const runs = await client.getJson(`${repositoryPath(project)}/actions/runs?head_sha=${encodeURIComponent(sha)}&per_page=${String(HEAD_RUNS_READ)}`, headRunsSchema);
  if (!runs.ok) {
    return getRateLimit(runs) ?? { checks: "unknown", failingCheck: null };
  }
  const summaries = runs.value.workflow_runs.map((run) => ({
    run,
    result: summarizeRun({
      id: run.id,
      headSha: sha,
      name: run.name ?? "",
      path: "",
      isCompleted: run.status === "completed",
      conclusion: run.conclusion,
      url: run.html_url,
      createdAt: run.created_at,
      updatedAt: run.created_at,
    }).result,
  }));
  const failed = summaries.find((summary) => summary.result === "failed");
  if (failed !== undefined) {
    const jobs = await getRunJobs(client, project.owner, project.name, failed.run.id);
    const limited = getRateLimit(jobs);
    if (limited !== null) {
      return limited;
    }
    const failedJob = jobs.ok ? jobs.value.find((job) => job.isCompleted && job.conclusion !== null && FAILED_CONCLUSIONS.has(job.conclusion)) : undefined;
    const name = failedJob?.name ?? failed.run.name ?? "";
    return { checks: "failed", failingCheck: name === "" ? null : name };
  }
  if (summaries.some((summary) => summary.result === "running")) {
    return { checks: "running", failingCheck: null };
  }
  return { checks: summaries.length === 0 ? "none" : "passed", failingCheck: null };
}

async function readUpdate(client: ForgeClient, project: AdapterProject): Promise<PackageUpdate | RateLimited> {
  const pulls = await client.getJson(`${repositoryPath(project)}/pulls?state=all&sort=created&direction=desc&per_page=${String(PULLS_READ)}`, z.array(pullSchema));
  if (!pulls.ok) {
    return getRateLimit(pulls) ?? { kind: "unknown" };
  }
  const pull = pulls.value.filter(isUpdatePull).sort((left, right) => right.created_at.localeCompare(left.created_at))[0];
  if (pull === undefined) {
    return { kind: "none" };
  }
  const base = { kind: "pull", number: pull.number, url: pull.html_url } as const;
  if (typeof pull.merged_at === "string" && pull.merged_at !== "") {
    return { ...base, state: "merged", at: pull.merged_at, checks: "none", failingCheck: null };
  }
  if (pull.state !== "open") {
    return { ...base, state: "closed", at: pull.created_at, checks: "none", failingCheck: null };
  }
  const checks = await getHeadChecks(client, project, pull.head.sha);
  return isRateLimited(checks) ? checks : { ...base, state: "open", at: pull.created_at, ...checks };
}

async function readHeld(client: ForgeClient, project: AdapterProject): Promise<HeldPackage[] | null | RateLimited> {
  const file = await client.getJsonFile(project.owner, project.name, WORKFLOW_FILE, project.branch);
  if (!file.ok) {
    return getRateLimit(file) ?? (file.kind === "not_found" ? [] : null);
  }
  const workflow = workflowSchema.safeParse(file.value);
  if (!workflow.success) {
    return null;
  }
  return (workflow.data.routines?.packageUpdates?.hold ?? []).flatMap((entry) => {
    const hold = holdEntrySchema.safeParse(entry);
    if (!hold.success) {
      return [];
    }
    const issue = hold.data.issue === null || hold.data.issue === undefined ? "" : String(hold.data.issue).trim();
    const since = hold.data.since?.trim() ?? "";
    return [{ package: hold.data.package, issue: issue === "" ? null : issue, since: since === "" ? null : since }];
  });
}

function byKeyThenName(left: string, right: string): number {
  const keys: readonly string[] = KEY_PACKAGES;
  const leftKey = keys.indexOf(left);
  const rightKey = keys.indexOf(right);
  if (leftKey !== rightKey) {
    return (leftKey === -1 ? keys.length : leftKey) - (rightKey === -1 ? keys.length : rightKey);
  }
  return left.localeCompare(right);
}

type LockedPackages = Readonly<Record<string, { readonly version?: string }>>;

async function readLocked(client: ForgeClient, project: AdapterProject): Promise<LockedPackages | RateLimited> {
  const file = await client.getJsonFile(project.owner, project.name, LOCKFILE, project.branch);
  if (!file.ok) {
    return getRateLimit(file) ?? {};
  }
  const lockfile = lockfileSchema.safeParse(file.value);
  return lockfile.success ? (lockfile.data.packages ?? {}) : {};
}

type ManifestRead =
  | { readonly status: "value"; readonly names: readonly string[] }
  | { readonly status: "absent" }
  | { readonly status: "unknown"; readonly reason: string }
  | RateLimited;

async function readScopedNames(client: ForgeClient, project: AdapterProject): Promise<ManifestRead> {
  const file = await client.getJsonFile(project.owner, project.name, MANIFEST_FILE, project.branch);
  if (!file.ok) {
    if (file.kind === "not_found") {
      return { status: "absent" };
    }
    return getRateLimit(file) ?? { status: "unknown", reason: file.kind === "invalid_answer" ? "manifest_invalid" : "manifest_unreadable" };
  }
  const manifest = manifestSchema.safeParse(file.value);
  if (!manifest.success) {
    return { status: "unknown", reason: "manifest_invalid" };
  }
  const names = new Set([...Object.keys(manifest.data.dependencies ?? {}), ...Object.keys(manifest.data.devDependencies ?? {})]);
  return { status: "value", names: [...names].filter((name) => name.startsWith(PACKAGE_SCOPE)).sort(byKeyThenName) };
}

interface VersionsQuery {
  readonly client: ForgeClient;
  readonly project: AdapterProject;
  readonly registry: NpmRegistry;
  readonly names: readonly string[];
}

async function readVersions({ client, project, registry, names }: VersionsQuery): Promise<PackageVersion[] | RateLimited> {
  if (names.length === 0) {
    return [];
  }
  const locked = await readLocked(client, project);
  if (isRateLimited(locked)) {
    return locked;
  }
  return Promise.all(
    names.map(async (name) => {
      const version = locked[`node_modules/${name}`]?.version?.trim() ?? "";
      return { name, locked: version === "" ? null : version, latest: await registry.getLatestVersion(name) };
    }),
  );
}

export async function readPackages(context: AdapterContext & { readonly registry: NpmRegistry }): Promise<AdapterRead<PackagesState>> {
  const { client, project, registry } = context;
  const manifest = await readScopedNames(client, project);
  if (manifest.status === "unknown" || manifest.status === "rate_limited") {
    return manifest;
  }
  const update = await readUpdate(client, project);
  if (isRateLimited(update)) {
    return update;
  }
  if (manifest.status === "absent" && update.kind !== "pull") {
    return { status: "absent" };
  }
  const held = await readHeld(client, project);
  if (isRateLimited(held)) {
    return held;
  }
  const packages = manifest.status === "value" ? await readVersions({ client, project, registry, names: manifest.names }) : [];
  if (isRateLimited(packages)) {
    return packages;
  }
  return { status: "value", value: { update, held, packages } };
}
