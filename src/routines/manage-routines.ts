// A project's routines as its Routines tab manages them (CT-10): add (the token sealed before it is stored), replace
// the token, enable or disable, delete, and Test. The token's text goes from the form to the token box and nowhere
// else: never into a log line, an error or an answer.
import { err, ok, type Clock, type Result } from "@softure-ai/core";
import type { Queryable } from "@softure-ai/db";
import { createLogger } from "@softure-ai/observability";
import {
  addRoutine,
  COCKPIT_ISSUES_KIND,
  deleteRoutine,
  findRoutine,
  recordRoutineCall,
  reserveCall,
  updateRoutine,
  type FireLimits,
} from "../../modules/projects/routines.ts";
import { TEST_FIRE_TEXT, type FireFailureReason, type RoutinesApi } from "./routines-api.ts";
import { getTokenLast4, type TokenBox } from "./token-box.ts";
import { parseTriggerId } from "./trigger-id.ts";
import { FIRE_LIMITS } from "./wake-issue.ts";

export const MAX_NAME_LENGTH = 80;
export const MAX_TOKEN_LENGTH = 4096;
const KIND_PATTERN = /^[a-z][a-z0-9-]{0,39}$/;

export type RoutineErrorCode =
  | "routines.name_missing"
  | "routines.kind_invalid"
  | "routines.trigger_invalid"
  | "routines.token_missing"
  | "routines.secret_missing"
  | "routines.not_found"
  | "routines.storage_failed";

export interface ManageContext {
  readonly db: Queryable;
  readonly clock: Clock;
  /** Null without ROUTINE_TOKEN_SECRET: nothing can be stored or fired. */
  readonly box: TokenBox | null;
}

export interface NewRoutineInput {
  readonly repositoryKey: string;
  readonly name: string;
  readonly kind: string;
  /** The trigger id or the routine's fire URL. */
  readonly trigger: string;
  readonly token: string;
  readonly enabled: boolean;
}

const logger = createLogger("routines");

function checkToken(token: string): RoutineErrorCode | null {
  const trimmed = token.trim();
  return trimmed === "" || trimmed.length > MAX_TOKEN_LENGTH ? "routines.token_missing" : null;
}

export async function addProjectRoutine(context: ManageContext, input: NewRoutineInput): Promise<Result<{ id: number }, RoutineErrorCode>> {
  const name = input.name.replace(/\s+/g, " ").trim();
  if (name === "" || name.length > MAX_NAME_LENGTH) {
    return err("routines.name_missing");
  }
  const kind = input.kind.trim() === "" ? COCKPIT_ISSUES_KIND : input.kind.trim();
  if (!KIND_PATTERN.test(kind)) {
    return err("routines.kind_invalid");
  }
  const triggerId = parseTriggerId(input.trigger);
  if (triggerId === null) {
    return err("routines.trigger_invalid");
  }
  const tokenProblem = checkToken(input.token);
  if (tokenProblem !== null) {
    return err(tokenProblem);
  }
  if (context.box === null) {
    return err("routines.secret_missing");
  }
  const token = input.token.trim();
  const added = await addRoutine(context.db, {
    repositoryKey: input.repositoryKey,
    name,
    kind,
    triggerId,
    tokenCiphertext: context.box.seal(token),
    tokenLast4: getTokenLast4(token),
    enabled: input.enabled,
    at: context.clock.now(),
  });
  if (!added.ok) {
    return err("routines.storage_failed");
  }
  logger.info("routine added", { repository: input.repositoryKey, routine_id: added.value.id, trigger: triggerId, kind });
  return ok({ id: added.value.id });
}

async function change(
  context: ManageContext,
  repositoryKey: string,
  id: number,
  values: Parameters<typeof updateRoutine>[3],
  what: string,
): Promise<Result<undefined, RoutineErrorCode>> {
  const updated = await updateRoutine(context.db, repositoryKey, id, values, context.clock.now());
  if (!updated.ok) {
    return err("routines.storage_failed");
  }
  if (!updated.value) {
    return err("routines.not_found");
  }
  logger.info(what, { repository: repositoryKey, routine_id: id });
  return ok(undefined);
}

export async function replaceRoutineToken(context: ManageContext, repositoryKey: string, id: number, token: string): Promise<Result<undefined, RoutineErrorCode>> {
  const tokenProblem = checkToken(token);
  if (tokenProblem !== null) {
    return err(tokenProblem);
  }
  if (context.box === null) {
    return err("routines.secret_missing");
  }
  const trimmed = token.trim();
  return change(context, repositoryKey, id, { token: { ciphertext: context.box.seal(trimmed), last4: getTokenLast4(trimmed) } }, "routine token replaced");
}

export function setRoutineEnabled(context: ManageContext, repositoryKey: string, id: number, enabled: boolean): Promise<Result<undefined, RoutineErrorCode>> {
  return change(context, repositoryKey, id, { enabled }, enabled ? "routine enabled" : "routine disabled");
}

export async function removeRoutine(context: ManageContext, repositoryKey: string, id: number): Promise<Result<undefined, RoutineErrorCode>> {
  const deleted = await deleteRoutine(context.db, repositoryKey, id);
  if (!deleted.ok) {
    return err("routines.storage_failed");
  }
  if (!deleted.value) {
    return err("routines.not_found");
  }
  logger.info("routine deleted", { repository: repositoryKey, routine_id: id });
  return ok(undefined);
}

export type TestOutcome =
  | { readonly kind: "sent"; readonly status: number }
  | { readonly kind: "failed"; readonly status: number | null; readonly reason: FireFailureReason | "limit" | "token_unreadable" };

/** The Test button: fires the test text and answers the HTTP result. It counts toward the limits like a fire. */
export async function testRoutine(
  context: ManageContext & { readonly api: RoutinesApi; readonly limits?: FireLimits },
  repositoryKey: string,
  id: number,
): Promise<Result<TestOutcome, RoutineErrorCode>> {
  const found = await findRoutine(context.db, id);
  if (!found.ok) {
    return err("routines.storage_failed");
  }
  const routine = found.value;
  if (routine === null || routine.repositoryKey !== repositoryKey) {
    return err("routines.not_found");
  }
  if (context.box === null) {
    return err("routines.secret_missing");
  }
  const token = context.box.open(routine.tokenCiphertext);
  const fields = { repository: repositoryKey, routine_id: id, trigger: routine.triggerId };
  if (token === null) {
    logger.warn("routine test failed", { ...fields, reason: "token_unreadable" });
    return ok({ kind: "failed", status: null, reason: "token_unreadable" });
  }
  const reservation = await reserveCall(context.db, id, context.clock.now(), context.limits ?? FIRE_LIMITS);
  if (!reservation.ok) {
    return err("routines.storage_failed");
  }
  if (reservation.value.kind === "limited") {
    logger.info("routine test refused", { ...fields, reason: "limit" });
    return ok({ kind: "failed", status: null, reason: "limit" });
  }
  const result = await context.api.fire({ triggerId: routine.triggerId, token, text: TEST_FIRE_TEXT });
  const recorded = await recordRoutineCall(context.db, id, { ok: result.ok, status: result.status, at: context.clock.now() });
  if (!recorded.ok) {
    return err("routines.storage_failed");
  }
  if (result.ok) {
    logger.info("routine test fired", { ...fields, status: result.status });
    return ok({ kind: "sent", status: result.status });
  }
  logger.warn("routine test failed", { ...fields, status: result.status ?? undefined, reason: result.reason });
  return ok({ kind: "failed", status: result.status, reason: result.reason });
}
