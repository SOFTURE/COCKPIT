// The assistant's answer through the inbox's rule, named after the token's account like an answer in the app (FR-16).
import { err, type Clock, type Result } from "@softure-ai/core";
import type { Queryable } from "@softure-ai/db";
import { answerEntry, type AnswerErrorCode, type SentAnswer } from "../decisions/answer-entry.ts";
import type { ForgeClient } from "../forge/client.ts";
import type { WakeDependencies } from "../routines/wake-issue.ts";
import { findAnswererName } from "../team/members.ts";
import type { EntryAnswerRequest } from "./answer-tool.ts";

export interface AnswerAsAccountOptions {
  readonly db: Queryable;
  readonly client: ForgeClient | null;
  readonly clock: Clock;
  readonly request: EntryAnswerRequest;
  /** Fires the project's routines once the issue exists (CT-10). */
  readonly wake?: WakeDependencies | null;
}

/** Looks up who the token's account is, then answers; an account that cannot be read sends nothing. */
export async function answerAsAccount(options: AnswerAsAccountOptions): Promise<Result<SentAnswer, AnswerErrorCode>> {
  const { db, client, clock, request } = options;
  const name = await findAnswererName(db, request.userId);
  if (!name.ok) {
    return err("decisions.storage_failed");
  }
  return answerEntry({ ...request, answeredByName: name.value, db, client, clock, wake: options.wake ?? null });
}
