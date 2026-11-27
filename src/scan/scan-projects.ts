// One scan: every watched project's `context/state.json`, cockpit issues, latest release and main-branch
// workflow runs are read once and stored (FR-3, FR-7), and every sent answer learns when its own issue closed (#166).
// A project that fails is recorded with its reason and the scan goes on; when the forge's budget runs low the scan
// stops and asks to run again later, keeping what it already read. The optional adapters it is given (FR-17) read
// after the forge facts; their results are stored beside them.
import { ok, type Clock, type Result } from "@softure-ai/core";
import { createLogger, type Logger } from "@softure-ai/observability";
import type { Queryable } from "@softure-ai/db";
import { recordAdapterRead, type StoredAdapterResult } from "../../modules/adapters/reads.ts";
import { findAnswersAwaitingClosure, recordAnswerIssueClosed } from "../../modules/projects/answers.ts";
import { findRepositories, type WatchedRepository } from "../../modules/projects/queries.ts";
import { recordForgeFacts } from "../../modules/overview/facts.ts";
import { recordRead, type IssuesStatus, type ReadStatus } from "../../modules/projects/reads.ts";
import type { ProjectAdapter } from "../adapters/contract.ts";
import type { ForgeClient, ForgeIssue, ForgeRead } from "../forge/client.ts";
import { readIssueState } from "../forge/issue-state.ts";
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
  /** Told how many projects are read so far: 0 before the first, then once after each project, failed ones included. */
  readonly onProgress?: (done: number, total: number) => Promise<void>;
  /** Where each project's outcome and the scan's end are logged; `scan` by default. */
  readonly logger?: Logger;
}

const defaultLogger = createLogger("scan");

/**
 * A project whose state could not be read, or whose adapter answered unknown (a refused Grafana, unreadable rules), is
 * worth a warning; a project without a state file is only noted.
 */
function logProjectRead(logger: Logger, fields: { repository: string; status: ReadStatus; issues: IssuesStatus; adapters: Record<string, string> }) {
  const { adapters, ...rest } = fields;
  const line = { ...rest, ...Object.fromEntries(Object.entries(adapters).map(([id, status]) => [`adapter_${id}`, status])) };
  const hasUnknownAdapter = Object.values(adapters).some((status) => status.startsWith("unknown"));
  if ((fields.status === "ok" || fields.status === "no_state") && !hasUnknownAdapter) {
    logger.info("project read", line);
  } else {
    logger.warn("project read failed", line);
  }
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

/** An answer whose own issue the scan saw closed. */
interface AnswerClosure {
  readonly answerId: number;
  readonly closedAt: Date;
}

type ClosuresRead = { readonly kind: "read"; readonly closures: readonly AnswerClosure[] } | { readonly kind: "rate_limited"; readonly seconds: number };

function toClosedAt(closedAt: string | null, fallback: Date): Date {
  const parsed = closedAt === null ? Number.NaN : Date.parse(closedAt);
  return Number.isFinite(parsed) ? new Date(parsed) : fallback;
}

/**
 * The project's sent answers whose issue is now closed (#166). An issue in the labelled list answers from there;
 * any other is read by its number, whatever labels it carries. A failed read leaves its answer for the next scan.
 */
async function readAnswerClosures(
  options: ScanProjectsOptions,
  target: { readonly key: string; readonly owner: string; readonly name: string; readonly listed: readonly ForgeIssue[] },
): Promise<Result<ClosuresRead>> {
  const awaiting = await findAnswersAwaitingClosure(options.db, target.key);
  if (!awaiting.ok) {
    return awaiting;
  }
  const listed = new Map(target.listed.map((issue) => [issue.number, issue]));
  const closures: AnswerClosure[] = [];
  for (const answer of awaiting.value) {
    const known = listed.get(answer.issueNumber);
    const read = known === undefined ? await readIssueState(options.client, target.owner, target.name, answer.issueNumber) : { ok: true as const, value: known };
    if (!read.ok) {
      if (read.kind === "rate_limited") {
        return ok({ kind: "rate_limited", seconds: read.retryAfterSeconds ?? DEFAULT_RETRY_SECONDS });
      }
      continue;
    }
    if (read.value.state === "closed") {
      closures.push({ answerId: answer.id, closedAt: toClosedAt(read.value.closedAt, options.clock.now()) });
    }
  }
  return ok({ kind: "read", closures });
}

async function scanProject(options: ScanProjectsOptions, repository: WatchedRepository): Promise<Result<ProjectOutcome>> {
  const [owner = "", name = ""] = repository.fullName.split("/");
  const file = await options.client.getJsonFile(owner, name, STATE_FILE_PATH, repository.defaultBranch);
  if (!file.ok && file.kind === "rate_limited") {
    return ok({ kind: "rate_limited", seconds: file.retryAfterSeconds ?? DEFAULT_RETRY_SECONDS });
  }
  const issues = await options.client.listCockpitIssues(owner, name);
  if (!issues.ok && issues.kind === "rate_limited") {
    return ok({ kind: "rate_limited", seconds: issues.retryAfterSeconds ?? DEFAULT_RETRY_SECONDS });
  }
  const facts = await readForgeFacts({ client: options.client, owner, name, branch: repository.defaultBranch });
  if (facts.kind === "rate_limited") {
    return ok({ kind: "rate_limited", seconds: facts.retryAfterSeconds ?? DEFAULT_RETRY_SECONDS });
  }
  const closures = await readAnswerClosures(options, { key: repository.key, owner, name, listed: issues.ok ? issues.value : [] });
  if (!closures.ok) {
    return closures;
  }
  if (closures.value.kind === "rate_limited") {
    return ok({ kind: "rate_limited", seconds: closures.value.seconds });
  }
  const adapterResults: { readonly adapter: string; readonly result: StoredAdapterResult }[] = [];
  for (const adapter of options.adapters ?? []) {
    const read = await adapter.read({ client: options.client, project: { owner, name, branch: repository.defaultBranch } });
    if (read.status === "rate_limited") {
      return ok({ kind: "rate_limited", seconds: read.retryAfterSeconds ?? DEFAULT_RETRY_SECONDS });
    }
    adapterResults.push({ adapter: adapter.id, result: read });
  }
  // `unknown` names its reason (e.g. backend_refused): the reason is what an operator acts on.
  const adapterOutcomes = Object.fromEntries(
    adapterResults.map(({ adapter, result }) => [adapter, result.status === "unknown" ? `unknown:${result.reason}` : result.status]),
  );

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
  for (const closure of closures.value.closures) {
    const recordedClosure = await recordAnswerIssueClosed(options.db, closure.answerId, closure.closedAt);
    if (!recordedClosure.ok) {
      return recordedClosure;
    }
  }
  for (const { adapter, result } of adapterResults) {
    const recordedAdapter = await recordAdapterRead(options.db, { key: repository.key, adapter, result, readAt: options.clock.now() });
    if (!recordedAdapter.ok) {
      return recordedAdapter;
    }
  }
  logProjectRead(options.logger ?? defaultLogger, {
    repository: repository.fullName,
    status,
    issues: toIssuesStatus(issues),
    adapters: adapterOutcomes,
  });
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
  const logger = options.logger ?? defaultLogger;
  const outcome = await scanAll(options);
  if (!outcome.ok) {
    logger.error("scan failed", { code: outcome.error });
  } else if (outcome.value.kind === "retry_later") {
    logger.warn("scan paused for the forge budget", { ...outcome.value.summary, retry_seconds: outcome.value.seconds });
  } else {
    logger.info("scan finished", { ...outcome.value.summary });
  }
  return outcome;
}

async function scanAll(options: ScanProjectsOptions): Promise<Result<ScanOutcome>> {
  const repositories = await findRepositories(options.db);
  if (!repositories.ok) {
    return repositories;
  }
  let read = 0;
  let failed = 0;
  const total = repositories.value.length;
  await options.onProgress?.(0, total);
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
    await options.onProgress?.(read + failed, total);
  }
  return ok({ kind: "done", summary: { read, failed } });
}
