// A broadcast (CV-1): one message from COCKPIT becomes exactly one owner-word issue in every chosen project. It is the
// same write as an answer (NFR-7) and needs no other token scope (NFR-5). Each project's send is claimed in the
// database first, and before any creation COCKPIT looks for an issue that already carries the broadcast's marker, so
// a resubmitted form, a retry, a lost answer or a request that died never leaves a second issue.
import { err, ok, type Clock, type Result } from "@softure-ai/core";
import { createLogger } from "@softure-ai/observability";
import type { Queryable } from "@softure-ai/db";
import {
  claimSend,
  findBroadcast,
  findSends,
  markSendFailed,
  markSendSent,
  saveBroadcast,
  takeOverSend,
  type StoredBroadcast,
  type StoredSend,
} from "../../modules/projects/broadcasts.ts";
import { findRepositories } from "../../modules/projects/queries.ts";
import type { ForgeClient, ForgeReadFailure } from "../forge/client.ts";
import { findIssueLabel } from "../forge/issue-label.ts";
import { formatBroadcastIssue } from "../forge/issues.ts";
import { MAX_BODY_LENGTH, MAX_TITLE_LENGTH } from "./broadcast-limits.ts";
import { parseBroadcastMarker } from "./broadcast-marker.ts";

/** A send still `creating` after this long belongs to a request that died; the next send or retry takes it over. */
export const STALE_SEND_MS = 10 * 60_000;
/** How many projects one broadcast sends to at once: a 13-project send takes seconds, well under the forge's limits. */
export const SEND_CONCURRENCY = 4;

export { MAX_BODY_LENGTH, MAX_TITLE_LENGTH };

export type BroadcastErrorCode =
  | "broadcast.storage_failed"
  | "broadcast.forge_not_configured"
  | "broadcast.title_missing"
  | "broadcast.title_too_long"
  | "broadcast.body_missing"
  | "broadcast.body_too_long"
  | "broadcast.no_projects"
  | "broadcast.project_not_watched"
  | "broadcast.not_found"
  | "broadcast.send_not_found";

/** Why one project's send failed; the page names each and offers a retry. */
export type SendFailure = "label_missing" | "forge_refused" | "forge_unauthorized" | "forge_rate_limited" | "forge_unavailable";

export interface SendBroadcastInput {
  readonly db: Queryable;
  readonly client: ForgeClient | null;
  readonly clock: Clock;
  /** Made when the form was shown: a resubmitted form is the same broadcast. */
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly repositoryKeys: readonly string[];
  readonly sentBy: string;
  /** The sender as people read it (display name or email), named in each issue (FR-16). */
  readonly sentByName: string;
}

export interface RetrySendInput {
  readonly db: Queryable;
  readonly client: ForgeClient | null;
  readonly clock: Clock;
  readonly broadcastId: string;
  readonly repositoryKey: string;
}

interface Project {
  readonly key: string;
  readonly fullName: string;
}

type SendOutcome = "sent" | "failed" | "in_progress";

function toSendFailure(failure: ForgeReadFailure): SendFailure {
  switch (failure.kind) {
    case "not_found":
    case "refused":
      // A repository the token no longer reaches answers like a missing one.
      return "forge_refused";
    case "unauthorized":
      return "forge_unauthorized";
    case "rate_limited":
      return "forge_rate_limited";
    case "invalid_answer":
    case "unavailable":
      return "forge_unavailable";
  }
}

function checkText(title: string, body: string): BroadcastErrorCode | null {
  if (title === "") {
    return "broadcast.title_missing";
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return "broadcast.title_too_long";
  }
  if (body === "") {
    return "broadcast.body_missing";
  }
  return body.length > MAX_BODY_LENGTH ? "broadcast.body_too_long" : null;
}

/** The issue in the project that already carries this broadcast's marker, if any. */
async function findMarkedIssue(client: ForgeClient, project: Project, broadcastId: string): Promise<{ number: number; url: string } | null> {
  const [owner = "", name = ""] = project.fullName.split("/");
  const issues = await client.listOwnerWordIssues(owner, name);
  if (!issues.ok) {
    return null;
  }
  const issue = issues.value.find((candidate) => parseBroadcastMarker(candidate.body)?.id === broadcastId);
  return issue === undefined ? null : { number: issue.number, url: issue.url };
}

/** Claims the project's send, or takes over a failed or stale one; an outcome when it is sent or another request holds it. */
async function holdSend(
  db: Queryable,
  clock: Clock,
  broadcastId: string,
  project: Project,
): Promise<Result<{ id: number; tookOver: boolean } | SendOutcome, BroadcastErrorCode>> {
  const now = clock.now();
  const claim = await claimSend(db, { broadcastId, repositoryKey: project.key, fullName: project.fullName, at: now });
  if (!claim.ok) {
    return err("broadcast.storage_failed");
  }
  if (claim.value.kind === "claimed") {
    return ok({ id: claim.value.id, tookOver: false });
  }
  const existing: StoredSend = claim.value.existing;
  if (existing.status === "sent") {
    return ok("sent");
  }
  if (existing.status === "creating" && now.getTime() - existing.updatedAt.getTime() < STALE_SEND_MS) {
    return ok("in_progress");
  }
  const tookOver = await takeOverSend(db, existing, now);
  if (!tookOver.ok) {
    return err("broadcast.storage_failed");
  }
  return ok(tookOver.value ? { id: existing.id, tookOver: true } : "in_progress");
}

const logger = createLogger("broadcast");

/** Sends to one project and logs the outcome with the reason of a failure; never the broadcast's text. */
async function sendToProject(
  db: Queryable,
  client: ForgeClient,
  clock: Clock,
  broadcast: StoredBroadcast,
  project: Project,
): Promise<Result<SendOutcome, BroadcastErrorCode>> {
  const outcome = await sendToProjectOnce(db, client, clock, broadcast, project);
  const fields = { broadcast: broadcast.id, repository: project.fullName };
  if (!outcome.ok) {
    logger.error("broadcast send failed", { ...fields, code: outcome.error });
  } else if (outcome.value !== "failed") {
    logger.info(outcome.value === "sent" ? "broadcast sent to project" : "broadcast send in progress elsewhere", fields);
  }
  return outcome;
}

async function sendToProjectOnce(
  db: Queryable,
  client: ForgeClient,
  clock: Clock,
  broadcast: StoredBroadcast,
  project: Project,
): Promise<Result<SendOutcome, BroadcastErrorCode>> {
  const held = await holdSend(db, clock, broadcast.id, project);
  if (!held.ok) {
    return held;
  }
  if (typeof held.value === "string") {
    return ok(held.value);
  }
  const { id, tookOver } = held.value;
  const recordSent = async (issue: { number: number; url: string }): Promise<Result<SendOutcome, BroadcastErrorCode>> => {
    const recorded = await markSendSent(db, id, issue, clock.now());
    return recorded.ok ? ok("sent") : err("broadcast.storage_failed");
  };
  const recordFailed = async (failure: SendFailure, answer?: ForgeReadFailure): Promise<Result<SendOutcome, BroadcastErrorCode>> => {
    const token = answer !== undefined && (answer.kind === "refused" || answer.kind === "unauthorized") ? (answer.token ?? null) : null;
    logger.warn("broadcast send failed in the project", { broadcast: broadcast.id, repository: project.fullName, reason: failure, token: token ?? undefined });
    const recorded = await markSendFailed(db, id, { failure, token, at: clock.now() });
    return recorded.ok ? ok("failed") : err("broadcast.storage_failed");
  };

  if (tookOver) {
    // A failed send may have been a lost answer, and a stale one may have died after the forge created the issue.
    const leftBehind = await findMarkedIssue(client, project, broadcast.id);
    if (leftBehind !== null) {
      return recordSent(leftBehind);
    }
  }

  const [owner = "", name = ""] = project.fullName.split("/");
  const label = await findIssueLabel(client, owner, name);
  if (!label.ok) {
    return recordFailed(toSendFailure(label), label);
  }
  if (label.value === null) {
    // FR-5: never an unlabelled issue.
    return recordFailed("label_missing");
  }
  const created = await client.createIssue(
    owner,
    name,
    formatBroadcastIssue({ id: broadcast.id, title: broadcast.title, body: broadcast.body, sentBy: broadcast.sentByName, label: label.value }),
  );
  if (created.ok) {
    return recordSent(created.value);
  }
  if (created.kind === "unavailable" || created.kind === "invalid_answer") {
    // The forge may have created the issue and lost its answer: adopt it rather than invite a second one.
    const adopted = await findMarkedIssue(client, project, broadcast.id);
    if (adopted !== null) {
      return recordSent(adopted);
    }
  }
  return recordFailed(toSendFailure(created), created);
}

async function findProjects(db: Queryable, keys: readonly string[]): Promise<Result<Project[], BroadcastErrorCode>> {
  const repositories = await findRepositories(db);
  if (!repositories.ok) {
    return err("broadcast.storage_failed");
  }
  const projects: Project[] = [];
  for (const key of new Set(keys)) {
    const repository = repositories.value.find((candidate) => candidate.key === key);
    if (repository === undefined) {
      return err("broadcast.project_not_watched");
    }
    projects.push({ key: repository.key, fullName: repository.fullName });
  }
  return ok(projects);
}

/** Sends the broadcast to every chosen project, SEND_CONCURRENCY at a time; a project's failure is kept on its send. */
export async function sendBroadcast(input: SendBroadcastInput): Promise<Result<{ id: string }, BroadcastErrorCode>> {
  const { db, client, clock } = input;
  const title = input.title.replace(/\s+/g, " ").trim();
  const body = input.body.trim();
  const invalid = checkText(title, body);
  if (invalid !== null) {
    return err(invalid);
  }
  if (input.repositoryKeys.length === 0) {
    return err("broadcast.no_projects");
  }
  if (client === null) {
    return err("broadcast.forge_not_configured");
  }
  const projects = await findProjects(db, input.repositoryKeys);
  if (!projects.ok) {
    return projects;
  }
  // A resubmitted form finds the broadcast it sent first and goes on with that text.
  const saved = await saveBroadcast(db, {
    id: input.id,
    title,
    body,
    sentBy: input.sentBy,
    sentByName: input.sentByName === "" ? null : input.sentByName,
    createdAt: clock.now(),
  });
  if (!saved.ok) {
    return err("broadcast.storage_failed");
  }
  // SEND_CONCURRENCY workers take the next project in the picked order until none is left.
  const pending = [...projects.value];
  const outcomes: Result<SendOutcome, BroadcastErrorCode>[] = [];
  const sendNext = async (): Promise<void> => {
    for (let project = pending.shift(); project !== undefined; project = pending.shift()) {
      outcomes.push(await sendToProject(db, client, clock, saved.value, project));
    }
  };
  await Promise.all(Array.from({ length: Math.min(SEND_CONCURRENCY, pending.length) }, sendNext));
  logger.info("broadcast sent", {
    broadcast: saved.value.id,
    user_id: input.sentBy,
    projects: projects.value.length,
    sent: outcomes.filter((outcome) => outcome.ok && outcome.value === "sent").length,
    failed: outcomes.filter((outcome) => !outcome.ok || outcome.value === "failed").length,
  });
  const failed = outcomes.find((outcome) => !outcome.ok);
  if (failed !== undefined && !failed.ok) {
    return err(failed.error);
  }
  return ok({ id: saved.value.id });
}

/** Sends a failed (or stale) send of a broadcast again; a sent one stays as it is. */
export async function retryBroadcastSend(input: RetrySendInput): Promise<Result<SendOutcome, BroadcastErrorCode>> {
  const { db, client, clock } = input;
  if (client === null) {
    return err("broadcast.forge_not_configured");
  }
  const [broadcast, sends] = await Promise.all([findBroadcast(db, input.broadcastId), findSends(db, input.broadcastId)]);
  if (!broadcast.ok || !sends.ok) {
    return err("broadcast.storage_failed");
  }
  if (broadcast.value === null) {
    return err("broadcast.not_found");
  }
  const send = sends.value.find((candidate) => candidate.repositoryKey === input.repositoryKey);
  if (send === undefined) {
    return err("broadcast.send_not_found");
  }
  // The send keeps the project's name from when it was sent, so a retry still reaches it after it left the list.
  return sendToProject(db, client, clock, broadcast.value, { key: send.repositoryKey, fullName: send.fullName });
}
