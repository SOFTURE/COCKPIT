// The one write COCKPIT makes (FR-5, NFR-7): an answer to an owner-queue entry becomes exactly one cockpit issue
// in that project. The answer is claimed in the database first, so a second answer of the same entry text (double
// click, two devices, the assistant) finds the first instead of creating another issue.
import { err, ok, type Clock, type Result } from "@softure-ai/core";
import { createLogger } from "@softure-ai/observability";
import type { Queryable } from "@softure-ai/db";
import {
  claimAnswer,
  findAnswers,
  markAnswerSent,
  releaseAnswer,
  takeOverStaleClaim,
  type NewAnswer,
  type StoredAnswer,
} from "../../modules/projects/answers.ts";
import { findRepositories } from "../../modules/projects/queries.ts";
import { findReads } from "../../modules/projects/reads.ts";
import type { ForgeClient, ForgeReadFailure } from "../forge/client.ts";
import { hasIssueLabel } from "../forge/issue-label.ts";
import { formatAnswerIssue } from "../forge/issues.ts";
import { parseAnswerMarker, type Answer } from "../inbox/answer-marker.ts";
import type { OwnerQueueEntry } from "../state/state-schema.ts";
import { getStoredEntries } from "../state/stored-entries.ts";
import { wakeAfterIssue, type WakeDependencies } from "../routines/wake-issue.ts";

/** A claim still `creating` after this long belongs to a request that died; the next answer takes it over. */
export const STALE_CLAIM_MS = 10 * 60_000;

export const MAX_NOTE_LENGTH = 2000;

export type AnswerErrorCode =
  | "decisions.storage_failed"
  | "decisions.forge_not_configured"
  | "decisions.note_too_long"
  | "decisions.project_not_watched"
  | "decisions.entry_gone"
  | "decisions.entry_changed"
  | "decisions.answer_in_progress"
  | "decisions.label_missing"
  | "decisions.forge_refused"
  | "decisions.forge_unauthorized"
  | "decisions.forge_rate_limited"
  | "decisions.forge_unavailable";

export interface AnswerEntryInput {
  readonly db: Queryable;
  readonly client: ForgeClient | null;
  readonly clock: Clock;
  readonly userId: string;
  /** The answerer as people read it (display name or email), kept with the answer and named in the issue (FR-16). */
  readonly answeredByName: string;
  readonly repositoryKey: string;
  readonly entryId: string;
  /** The entry text the owner saw: an answer never lands on text they did not read. */
  readonly entryText: string;
  readonly answer: Answer;
  readonly note: string | null;
  /** Fires the project's routines once the issue exists (CT-10); null or left out fires nothing. */
  readonly wake?: WakeDependencies | null;
}

export interface SentAnswer {
  readonly answer: Answer;
  readonly issueNumber: number;
  readonly issueUrl: string;
  /** True when the entry text had been answered already and nothing new was created. */
  readonly alreadyAnswered: boolean;
}

interface Target {
  readonly key: string;
  readonly owner: string;
  readonly name: string;
  readonly fullName: string;
  readonly entry: OwnerQueueEntry;
}

function normalizeNote(note: string | null): string | null {
  const trimmed = note?.trim() ?? "";
  return trimmed === "" ? null : trimmed;
}

function toAnswerError(failure: ForgeReadFailure): AnswerErrorCode {
  switch (failure.kind) {
    case "not_found":
      // The token no longer reaches the repository, which the forge answers like a missing one.
      return "decisions.forge_refused";
    case "refused":
      return "decisions.forge_refused";
    case "unauthorized":
      return "decisions.forge_unauthorized";
    case "rate_limited":
      return "decisions.forge_rate_limited";
    case "invalid_answer":
    case "unavailable":
      return "decisions.forge_unavailable";
  }
}

async function findTarget(db: Queryable, repositoryKey: string, entryId: string, entryText: string): Promise<Result<Target, AnswerErrorCode>> {
  const [repositories, reads] = await Promise.all([findRepositories(db), findReads(db)]);
  if (!repositories.ok || !reads.ok) {
    return err("decisions.storage_failed");
  }
  const repository = repositories.value.find((candidate) => candidate.key === repositoryKey);
  if (repository === undefined) {
    return err("decisions.project_not_watched");
  }
  const read = reads.value.find((candidate) => candidate.key === repositoryKey);
  const entry = getStoredEntries(read?.state ?? null).find((candidate) => candidate.id === entryId);
  if (entry === undefined) {
    return err("decisions.entry_gone");
  }
  if (entry.text !== entryText) {
    return err("decisions.entry_changed");
  }
  const [owner = "", name = ""] = repository.fullName.split("/");
  return ok({ key: repository.key, owner, name, fullName: repository.fullName, entry });
}

/**
 * An cockpit issue for this entry and answer created at or after `since` that no other answer claims: what a
 * request that lost the forge's answer (a timeout) or died before recording it may have left behind.
 */
async function findLeftBehindIssue(
  db: Queryable,
  client: ForgeClient,
  target: Target,
  answer: Answer,
  since: Date,
): Promise<{ number: number; url: string; title: string } | null> {
  const [issues, answers] = await Promise.all([client.listCockpitIssues(target.owner, target.name), findAnswers(db)]);
  if (!issues.ok || !answers.ok) {
    return null;
  }
  const claimed = new Set(answers.value.filter((row) => row.issueNumber !== null).map((row) => `${row.repositoryKey}#${row.issueNumber}`));
  const issue = issues.value.find((candidate) => {
    const marker = parseAnswerMarker(candidate.body);
    return (
      marker !== null &&
      marker.entry === target.entry.id &&
      marker.answer === answer &&
      Date.parse(candidate.createdAt) >= since.getTime() &&
      !claimed.has(`${target.key}#${candidate.number}`)
    );
  });
  return issue === undefined ? null : { number: issue.number, url: issue.url, title: issue.title };
}

function toSent(existing: StoredAnswer): Result<SentAnswer, AnswerErrorCode> {
  if (existing.status !== "sent" || existing.issueNumber === null || existing.issueUrl === null) {
    return err("decisions.answer_in_progress");
  }
  return ok({ answer: existing.answer, issueNumber: existing.issueNumber, issueUrl: existing.issueUrl, alreadyAnswered: true });
}

const logger = createLogger("decisions");

/** Refusals that follow from what the member did or saw (a stale page, a double click), not from a fault. */
const EXPECTED_REFUSALS = new Set<AnswerErrorCode>([
  "decisions.note_too_long",
  "decisions.entry_gone",
  "decisions.entry_changed",
  "decisions.answer_in_progress",
  "decisions.project_not_watched",
]);

/**
 * Answers one entry (see the file's header) and logs the outcome: the project, the entry id, the answer, the issue
 * and the account id, never the note or the entry text.
 */
export async function answerEntry(input: AnswerEntryInput): Promise<Result<SentAnswer, AnswerErrorCode>> {
  const result = await answerEntryOnce(input);
  const fields = { repository: input.repositoryKey, entry: input.entryId, answer: input.answer, user_id: input.userId };
  if (result.ok) {
    logger.info(result.value.alreadyAnswered ? "entry already answered" : "entry answered", {
      ...fields,
      issue: result.value.issueNumber,
    });
  } else if (EXPECTED_REFUSALS.has(result.error)) {
    logger.info("entry answer refused", { ...fields, code: result.error });
  } else {
    logger.error("entry answer failed", { ...fields, code: result.error });
  }
  return result;
}

async function answerEntryOnce(input: AnswerEntryInput): Promise<Result<SentAnswer, AnswerErrorCode>> {
  const { db, client, clock } = input;
  const note = normalizeNote(input.note);
  if (note !== null && note.length > MAX_NOTE_LENGTH) {
    return err("decisions.note_too_long");
  }
  if (client === null) {
    return err("decisions.forge_not_configured");
  }
  const target = await findTarget(db, input.repositoryKey, input.entryId, input.entryText);
  if (!target.ok) {
    return target;
  }
  const { entry } = target.value;
  const now = clock.now();
  const newAnswer: NewAnswer = {
    repositoryKey: input.repositoryKey,
    fullName: target.value.fullName,
    entryId: entry.id,
    entryText: entry.text,
    entryKind: entry.kind,
    entrySource: entry.source,
    entryItem: entry.item,
    answer: input.answer,
    note,
    answeredBy: input.userId,
    answeredByName: input.answeredByName,
    answeredAt: now,
  };

  const claim = await claimAnswer(db, newAnswer);
  if (!claim.ok) {
    return err("decisions.storage_failed");
  }
  let claimId: number;
  if (claim.value.kind === "taken") {
    const existing = claim.value.existing;
    if (existing.status === "sent" || now.getTime() - existing.answeredAt.getTime() < STALE_CLAIM_MS) {
      return toSent(existing);
    }
    const tookOver = await takeOverStaleClaim(db, existing.id, new Date(now.getTime() - STALE_CLAIM_MS), newAnswer);
    if (!tookOver.ok) {
      return err("decisions.storage_failed");
    }
    if (!tookOver.value) {
      return err("decisions.answer_in_progress");
    }
    // The request that died may have created the issue before it could record it.
    const leftBehind = await findLeftBehindIssue(db, client, target.value, existing.answer, existing.answeredAt);
    if (leftBehind !== null) {
      // The issue carries the dead request's answer, so the row keeps that answer, not this request's.
      const recorded = await markAnswerSent(db, existing.id, leftBehind, {
        answer: existing.answer,
        note: existing.note,
        answeredBy: existing.answeredBy,
        answeredByName: existing.answeredByName,
        answeredAt: existing.answeredAt,
      });
      if (!recorded.ok) {
        return err("decisions.storage_failed");
      }
      await wakeAfterIssue(input.wake ?? null, { repositoryKey: target.value.key, fullName: target.value.fullName, ...leftBehind });
      return ok({ answer: existing.answer, issueNumber: leftBehind.number, issueUrl: leftBehind.url, alreadyAnswered: true });
    }
    claimId = existing.id;
  } else {
    claimId = claim.value.id;
  }

  return createIssueForClaim({
    db,
    client,
    target: target.value,
    claimId,
    answer: input.answer,
    note,
    answeredBy: input.answeredByName,
    since: now,
    wake: input.wake ?? null,
  });
}

async function createIssueForClaim(options: {
  readonly db: Queryable;
  readonly client: ForgeClient;
  readonly target: Target;
  readonly claimId: number;
  readonly answer: Answer;
  readonly note: string | null;
  readonly answeredBy: string;
  readonly since: Date;
  readonly wake: WakeDependencies | null;
}): Promise<Result<SentAnswer, AnswerErrorCode>> {
  const { db, client, target, claimId, answer } = options;
  const release = async (code: AnswerErrorCode): Promise<Result<SentAnswer, AnswerErrorCode>> => {
    const released = await releaseAnswer(db, claimId);
    return err(released.ok ? code : "decisions.storage_failed");
  };

  const label = await hasIssueLabel(client, target.owner, target.name);
  if (!label.ok) {
    return release(toAnswerError(label));
  }
  if (!label.value) {
    // FR-5: never an unlabelled issue.
    return release("decisions.label_missing");
  }

  const issueToCreate = formatAnswerIssue({ entry: target.entry, answer, note: options.note, answeredBy: options.answeredBy });
  const created = await client.createIssue(target.owner, target.name, issueToCreate);
  let issue: { number: number; url: string; title: string } | null = created.ok ? { ...created.value, title: issueToCreate.title } : null;
  if (!created.ok && (created.kind === "unavailable" || created.kind === "invalid_answer")) {
    // The forge may have created the issue and lost its answer: adopt it rather than invite a second one.
    issue = await findLeftBehindIssue(db, client, target, answer, new Date(options.since.getTime() - 60_000));
  }
  if (issue === null) {
    return release(created.ok ? "decisions.forge_unavailable" : toAnswerError(created));
  }
  const recorded = await markAnswerSent(db, claimId, issue);
  if (!recorded.ok) {
    // The issue exists; the claim stays, and a later answer adopts the issue once the claim is stale.
    return err("decisions.storage_failed");
  }
  // The issue exists and is recorded first; a fire that fails is shown with a Retry, never as the answer's failure.
  await wakeAfterIssue(options.wake, { repositoryKey: target.key, fullName: target.fullName, ...issue });
  return ok({ answer, issueNumber: issue.number, issueUrl: issue.url, alreadyAnswered: false });
}
