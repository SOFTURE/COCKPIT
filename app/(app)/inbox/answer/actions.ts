"use server";

// The inbox's answer action (FR-5, FR-16): the signed-in member's answer to one entry becomes one owner-word issue.
import { requireUser } from "@softure-ai/auth/next";
import { systemClock } from "@softure-ai/core";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fillMessage, getMessages } from "../../../../messages/index.ts";
import config from "../../../../softure.config.ts";
import { getDatabase } from "../../../../src/database.ts";
import { answerEntry, MAX_NOTE_LENGTH, type AnswerErrorCode } from "../../../../src/decisions/answer-entry.ts";
import type { AnswerFormState } from "../../../../src/inbox/answer-form-state.ts";
import { OWNER_WORD_ANSWERS } from "../../../../src/inbox/owner-word-marker.ts";
import { getForgeClient } from "../../../../src/projects/forge-access.ts";
import { getAnswererName } from "../../../../src/team/answerer-name.ts";

const answerFormSchema = z.object({
  repositoryKey: z.string().min(1).max(200),
  entryId: z.string().min(1).max(200),
  entryText: z.string().max(10_000),
  answer: z.enum(OWNER_WORD_ANSWERS),
  // A longer note is refused by the rule with its own message.
  note: z.string().max(MAX_NOTE_LENGTH * 2).optional(),
});

/** The message key of each failure; the dictionary must hold every one, or this does not type-check. */
type AnswerErrorKey = AnswerErrorCode extends `decisions.${infer Key}` ? Key : never;

export async function answerEntryAction(_previous: AnswerFormState, formData: FormData): Promise<AnswerFormState> {
  const user = await requireUser();
  const copy = getMessages(config.locale).inbox;
  const parsed = answerFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "failed", message: copy.errors.invalid_request };
  }
  const { db } = await getDatabase();
  const result = await answerEntry({
    db,
    client: getForgeClient(),
    clock: systemClock,
    userId: user.id,
    answeredByName: getAnswererName(user),
    repositoryKey: parsed.data.repositoryKey,
    entryId: parsed.data.entryId,
    entryText: parsed.data.entryText,
    answer: parsed.data.answer,
    note: parsed.data.note ?? null,
  });
  if (!result.ok) {
    // Every code starts with `decisions.` (AnswerErrorCode).
    const key = result.error.slice("decisions.".length) as AnswerErrorKey;
    return { status: "failed", message: copy.errors[key] };
  }
  revalidatePath("/", "layout");
  const template = result.value.alreadyAnswered ? copy.alreadyAnswered : copy.answeredNow;
  return { status: "sent", message: fillMessage(template, { number: result.value.issueNumber }), issueUrl: result.value.issueUrl };
}
