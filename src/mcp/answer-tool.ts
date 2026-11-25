// The write tool's own part (FR-14): its input, and the step from what the assistant read to the inbox's rule.
// The rule itself is `answerEntry` (src/decisions/answer-entry.ts), never a copy.
import { err, ok, type Result } from "@softure-ai/core";
import { z } from "zod";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import { MAX_NOTE_LENGTH, type AnswerErrorCode, type SentAnswer } from "../decisions/answer-entry.ts";
import { parseRepositoryName } from "../forge/repository-name.ts";
import type { Inbox } from "../inbox/build-inbox.ts";
import { ANSWERS, type Answer } from "../inbox/answer-marker.ts";
import type { ProjectLookupError } from "./answers.ts";

type AnswerToolCopy = AppMessages["mcp"]["tools"]["answerEntry"];

/** The write tool's input, its fields described in the app's language. */
export function createAnswerEntryInput(copy: AnswerToolCopy) {
  return z.object({
    project: z.string().min(1).max(200).describe(copy.projectInput),
    entry: z.string().min(1).max(200).describe(copy.entryInput),
    text: z.string().min(1).max(10_000).describe(copy.textInput),
    answer: z.enum(ANSWERS).describe(copy.answerInput),
    // A longer note is refused by the rule with its own message.
    note: z.string().max(MAX_NOTE_LENGTH * 2).optional().describe(copy.noteInput),
  });
}

export type AnswerEntryToolInput = z.infer<ReturnType<typeof createAnswerEntryInput>>;

/** What the rule needs besides the database, the forge and the clock, which production wires once. */
export interface EntryAnswerRequest {
  readonly userId: string;
  readonly repositoryKey: string;
  readonly entryId: string;
  readonly entryText: string;
  readonly answer: Answer;
  readonly note: string | null;
}

export type EntryAnswerer = (request: EntryAnswerRequest) => Promise<Result<SentAnswer, AnswerErrorCode>>;

/** The inbox's own wording for every failure of the rule, so both paths say the same. */
export function getAnswerErrorHints(errors: AppMessages["inbox"]["errors"]): Readonly<Record<AnswerErrorCode, string>> {
  return {
    "decisions.storage_failed": errors.storage_failed,
    "decisions.forge_not_configured": errors.forge_not_configured,
    "decisions.note_too_long": errors.note_too_long,
    "decisions.project_not_watched": errors.project_not_watched,
    "decisions.entry_gone": errors.entry_gone,
    "decisions.entry_changed": errors.entry_changed,
    "decisions.answer_in_progress": errors.answer_in_progress,
    "decisions.label_missing": errors.label_missing,
    "decisions.forge_refused": errors.forge_refused,
    "decisions.forge_unauthorized": errors.forge_unauthorized,
    "decisions.forge_rate_limited": errors.forge_rate_limited,
    "decisions.forge_unavailable": errors.forge_unavailable,
  };
}

/**
 * The request for the rule. The assistant read entry texts with every untrusted-data marker defused, so a text equal
 * to the defused form of the entry it names stands for the entry's own text.
 */
export function toEntryAnswerRequest(options: {
  readonly input: AnswerEntryToolInput;
  readonly inbox: Inbox;
  readonly userId: string;
  readonly defuse: (text: string) => string;
}): Result<EntryAnswerRequest, ProjectLookupError> {
  const { input, inbox, userId, defuse } = options;
  const name = parseRepositoryName(input.project.trim());
  if (!name.ok) {
    return err("mcp.project_invalid");
  }
  const repositoryKey = name.value.key;
  const row = inbox.rows.find((candidate) => candidate.projectKey === repositoryKey && candidate.entry.id === input.entry);
  const entryText = row !== undefined && defuse(row.entry.text) === input.text ? row.entry.text : input.text;
  return ok({ userId, repositoryKey, entryId: input.entry, entryText, answer: input.answer, note: input.note ?? null });
}

/** What the tool answers: values COCKPIT wrote, no repository text. */
export function toAnsweredValue(options: { readonly project: string; readonly entryId: string; readonly sent: SentAnswer; readonly copy: AnswerToolCopy }) {
  const { project, entryId, sent, copy } = options;
  const template = sent.alreadyAnswered ? copy.alreadyAnswered : copy.answeredNow;
  return {
    project,
    entry: entryId,
    answer: sent.answer,
    issueNumber: sent.issueNumber,
    issueUrl: sent.issueUrl,
    alreadyAnswered: sent.alreadyAnswered,
    message: fillMessage(template, { number: sent.issueNumber }),
  };
}
