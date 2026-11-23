// One scan: every watched project's `context/state.json`, owner-word issues, latest release and main-branch
// workflow runs are read once and stored (FR-3, FR-7).
// A project that fails is recorded with its reason and the scan goes on; when the forge's budget runs low the scan
// stops and asks to run again later, keeping what it already read. The optional adapters it is given (FR-17) read
// after the forge facts; their results are stored beside them.
import { ok, type Clock, type Result } from "@softure-ai/core";
import type { Queryable } from "@softure-ai/db";
import { recordAdapterRead, type StoredAdapterResult } from "../../modules/adapters/reads.ts";
import { findRepositories, type WatchedRepository } from "../../modules/projects/queries.ts";
import { recordForgeFacts } from "../../modules/overview/facts.ts";
import { recordRead, type IssuesStatus, type ReadStatus } from "../../modules/projects/reads.ts";
import type { ProjectAdapter } from "../adapters/contract.ts";
import type { ForgeClient, ForgeIssue, ForgeRead } from "../forge/client.ts";
import { STATE_FILE_PATH } from "../forge/permissions.ts";
import { parseProjectState } from "../state/state-schema.ts";
import { readForgeFacts } from "./forge-facts.ts";

/** Below this many requests left the scan pauses until the budget refills (NFR-2 keeps the scan far under it). */
export const MIN_FORGE_BUDGET = 100;
/** Seconds to wait when the forge asks for patience without saying how long. */
export const DEFAULT_RETRY_SECONDS = 60;

export interface ScanSummary {
  readonly read: number;
  readonly failed: number;
}

export type ScanOutcome =
  | { readonly kind: "done"; readonly summary: ScanSummary }
  | { readonly kind: "retry_later"; readonly seconds: number; readonly summary: ScanSummary };

export interface ScanProjectsOptions {
  readonly db: Queryable;
  readonly client: ForgeClient;
  readonly clock: Clock;
  /** The optional adapters to run for every project; none by default. */
  readonly adapters?: readonly ProjectAdapter[];
}

type ProjectOutcome = { readonly kind: "recorded"; readonly isRead: boolean } | { readonly kind: "rate_limited"; readonly seconds: number };

function toReadStatus(failure: Exclude<ForgeRead<unknown>, { ok: true }>): ReadStatus {
  if (failure.kind === "not_found") {
    return "no_state";
  }
  if (failure.kind === "refused" || failure.kind === "unauthorized") {
    return "not_readable";
  }
  if (failure.kind === "invalid_answer") {
    return "state_invalid";
  }
  return "unavailable";
}

function toIssuesStatus(answer: ForgeRead<ForgeIssue[]>): IssuesStatus {
  if (answer.ok) {
    return "ok";
  }
  return answer.kind === "refused" || answer.kind === "unauthorized" || answer.kind === "not_found" ? "not_readable" : "unavailable";
}

async function scanProject(options: ScanProjectsOptions, repository: WatchedRepository): Promise<Result<ProjectOutcome>> {
  const [owner = "", name = ""] = repository.fullName.split("/");
  const file = await options.client.getJsonFile(owner, name, STATE_FILE_PATH, repository.defaultBranch);
  if (!file.ok && file.kind === "rate_limited") {
    return ok({ kind: "rate_limited", seconds: file.retryAfterSeconds ?? DEFAULT_RETRY_SECONDS });
  }
  const issues = await options.client.listOwnerWordIssues(owner, name);
  if (!issues.ok && issues.kind === "rate_limited") {
    return ok({ kind: "rate_limited", seconds: issues.retryAfterSeconds ?? DEFAULT_RETRY_SECONDS });
  }
  const facts = await readForgeFacts({ client: options.client, owner, name, branch: repository.defaultBranch });
  if (facts.kind === "rate_limited") {
    return ok({ kind: "rate_limited", seconds: facts.retryAfterSeconds ?? DEFAULT_RETRY_SECONDS });
  }
  const adapterResults: { readonly adapter: string; readonly result: StoredAdapterResult }[] = [];
  for (const adapter of options.adapters ?? []) {
    const read = await adapter.read({ client: options.client, project: { owner, name, branch: repository.defaultBranch } });
    if (read.status === "rate_limited") {
      return ok({ kind: "rate_limited", seconds: read.retryAfterSeconds ?? DEFAULT_RETRY_SECONDS });
    }
    adapterResults.push({ adapter: adapter.id, result: read });
  }

  let status: ReadStatus;
  let state: unknown;
  if (file.ok) {
    const parsed = parseProjectState(file.value);
    status = parsed.ok ? "ok" : parsed.error === "state.too_old" ? "state_too_old" : "state_invalid";
    state = parsed.ok ? parsed.value : undefined;
  } else {
    status = toReadStatus(file);
  }

  const recorded = await recordRead(options.db, {
    key: repository.key,
    status,
    issuesStatus: toIssuesStatus(issues),
    state,
    issues: issues.ok ? issues.value : undefined,
    readAt: options.clock.now(),
  });
  if (!recorded.ok) {
    return recorded;
  }
  const recordedFacts = await recordForgeFacts(options.db, { key: repository.key, ...facts.facts, readAt: options.clock.now() });
  if (!recordedFacts.ok) {
    return recordedFacts;
  }
  for (const { adapter, result } of adapterResults) {
    const recordedAdapter = await recordAdapterRead(options.db, { key: repository.key, adapter, result, readAt: options.clock.now() });
    if (!recordedAdapter.ok) {
      return recordedAdapter;
    }
  }
  return ok({ kind: "recorded", isRead: status === "ok" });
}

function secondsUntilBudgetRefills(client: ForgeClient, clock: Clock): number | null {
  const { remaining, resetAt } = client.getBudget();
  if (remaining === null || remaining >= MIN_FORGE_BUDGET) {
    return null;
  }
  if (resetAt === null) {
    return DEFAULT_RETRY_SECONDS;
  }
  return Math.max(1, Math.ceil(resetAt - clock.now().getTime() / 1000));
}

export async function scanProjects(options: ScanProjectsOptions): Promise<Result<ScanOutcome>> {
  const repositories = await findRepositories(options.db);
  if (!repositories.ok) {
    return repositories;
  }
  let read = 0;
  let failed = 0;
  for (const repository of repositories.value) {
    const waitSeconds = secondsUntilBudgetRefills(options.client, options.clock);
    if (waitSeconds !== null) {
      return ok({ kind: "retry_later", seconds: waitSeconds, summary: { read, failed } });
    }
    const outcome = await scanProject(options, repository);
    if (!outcome.ok) {
      return outcome;
    }
    if (outcome.value.kind === "rate_limited") {
      return ok({ kind: "retry_later", seconds: outcome.value.seconds, summary: { read, failed } });
    }
    if (outcome.value.isRead) {
      read += 1;
    } else {
      failed += 1;
    }
  }
  return ok({ kind: "done", summary: { read, failed } });
}
