// Firing scheduled tasks (CT-36). A due task is claimed (one conditional UPDATE, so it is taken once), then sent as a
// broadcast under the broadcast id the claim stored: a run taken over after a crash resends the same broadcast, whose
// per-project sends and marker never make a second issue. Projects no longer watched are skipped and named on the task.
import { err, ok, type Clock, type Result } from "@softure-ai/core";
import { createLogger } from "@softure-ai/observability";
import type { Queryable } from "@softure-ai/db";
import { findRepositories } from "../../modules/projects/queries.ts";
import {
  claimDueScheduledTasks,
  claimScheduledTaskNow,
  findScheduledTask,
  markScheduledTaskFailed,
  markScheduledTaskSent,
  type StoredScheduledTask,
} from "../../modules/projects/scheduled-tasks.ts";
import { sendBroadcast, STALE_SEND_MS } from "../broadcast/send-broadcast.ts";
import type { ForgeClient } from "../forge/client.ts";
import type { WakeDependencies } from "../routines/wake-issue.ts";
import type { ScheduledTaskErrorCode } from "./scheduled-task-errors.ts";

/**
 * A run still `sending` this long after its claim belongs to a worker that died; the next tick takes it over. One
 * minute beyond STALE_SEND_MS, so every project send of the dead run is stale too and gets resent, not skipped.
 */
export const STALE_RUN_MS = STALE_SEND_MS + 60_000;
/** How many due tasks one tick claims; the rest wait for the next minute. */
export const DUE_TASKS_PER_TICK = 20;

export interface ScheduledRunDependencies {
  readonly db: Queryable;
  readonly client: ForgeClient | null;
  readonly clock: Clock;
  readonly wake: WakeDependencies | null;
}

/** How a claimed run ended: sent (with the broadcast), failed with a reason, or left for a takeover. */
export type RunOutcome =
  | { readonly kind: "sent"; readonly broadcastId: string; readonly skippedKeys: readonly string[] }
  | { readonly kind: "failed"; readonly failure: string }
  | { readonly kind: "retry_later" };

const logger = createLogger("scheduled");

async function finishRun(
  deps: ScheduledRunDependencies,
  task: StoredScheduledTask & { readonly broadcastId: string; readonly claimedAt: Date },
  skippedKeys: readonly string[],
  failure: string | null,
): Promise<RunOutcome> {
  const record = { id: task.id, claimedAt: task.claimedAt, skippedKeys, at: deps.clock.now() };
  const recorded = failure === null ? await markScheduledTaskSent(deps.db, record) : await markScheduledTaskFailed(deps.db, { ...record, failure });
  if (!recorded.ok) {
    // The send is done; the next takeover finds every project sent and records it then.
    return { kind: "retry_later" };
  }
  return failure === null ? { kind: "sent", broadcastId: task.broadcastId, skippedKeys } : { kind: "failed", failure };
}

/** Sends one claimed task as its broadcast and records the outcome on the task. */
export async function runClaimedTask(deps: ScheduledRunDependencies, task: StoredScheduledTask): Promise<RunOutcome> {
  const { broadcastId, claimedAt } = task;
  if (broadcastId === null || claimedAt === null) {
    // The table's check makes a claimed task carry both.
    return { kind: "retry_later" };
  }
  const claimed = { ...task, broadcastId, claimedAt };
  const fields = { task: task.id, broadcast: broadcastId, planned_at: task.runAt.toISOString() };
  const repositories = await findRepositories(deps.db);
  if (!repositories.ok) {
    logger.error("scheduled task left for the next tick", { ...fields, code: "storage_failed" });
    return { kind: "retry_later" };
  }
  const watched = new Set(repositories.value.map((repository) => repository.key));
  const keys = task.repositoryKeys.filter((key) => watched.has(key));
  const skippedKeys = task.repositoryKeys.filter((key) => !watched.has(key));
  if (skippedKeys.length > 0) {
    logger.warn("scheduled task skips projects no longer watched", { ...fields, skipped: skippedKeys.length });
  }
  if (keys.length === 0) {
    logger.warn("scheduled task failed", { ...fields, reason: "no_projects" });
    return finishRun(deps, claimed, skippedKeys, "no_projects");
  }
  const sent = await sendBroadcast({
    db: deps.db,
    client: deps.client,
    clock: deps.clock,
    id: broadcastId,
    title: task.title,
    body: task.prompt,
    repositoryKeys: keys,
    sentBy: task.createdBy,
    sentByName: task.createdByName ?? "",
    wake: deps.wake,
  });
  if (sent.ok) {
    logger.info("scheduled task sent", { ...fields, projects: keys.length });
    return finishRun(deps, claimed, skippedKeys, null);
  }
  if (sent.error === "broadcast.storage_failed" || sent.error === "broadcast.project_not_watched") {
    // A storage failure, or a project unwatched since the filter above: the stale takeover runs it again.
    logger.error("scheduled task left for the next tick", { ...fields, code: sent.error });
    return { kind: "retry_later" };
  }
  const failure = sent.error.slice("broadcast.".length);
  logger.warn("scheduled task failed", { ...fields, reason: failure });
  return finishRun(deps, claimed, skippedKeys, failure);
}

/** One tick: claims the due tasks (and runs left by a dead worker) and sends each; returns how many it ran. */
export async function runDueScheduledTasks(deps: ScheduledRunDependencies, limit = DUE_TASKS_PER_TICK): Promise<Result<number, ScheduledTaskErrorCode>> {
  const now = deps.clock.now();
  const claimed = await claimDueScheduledTasks(deps.db, { at: now, staleBefore: new Date(now.getTime() - STALE_RUN_MS), limit });
  if (!claimed.ok) {
    return err("scheduled.storage_failed");
  }
  for (const task of claimed.value) {
    await runClaimedTask(deps, task);
  }
  return ok(claimed.value.length);
}

/** "Run now": sends a scheduled task at once through the same claim and send. */
export async function runScheduledTaskNow(deps: ScheduledRunDependencies, id: string): Promise<Result<RunOutcome, ScheduledTaskErrorCode>> {
  if (deps.client === null) {
    return err("scheduled.forge_not_configured");
  }
  const claimed = await claimScheduledTaskNow(deps.db, id, deps.clock.now());
  if (!claimed.ok) {
    return err("scheduled.storage_failed");
  }
  if (claimed.value === null) {
    const existing = await findScheduledTask(deps.db, id);
    if (!existing.ok) {
      return err("scheduled.storage_failed");
    }
    return err(existing.value === null ? "scheduled.not_found" : "scheduled.not_scheduled");
  }
  return ok(await runClaimedTask(deps, claimed.value));
}
