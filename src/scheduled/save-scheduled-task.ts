// Creating and editing a scheduled task (CT-36). The time is a local date-time in the app's zone, stored as its
// instant; a time more than a minute in the past is refused. Title and prompt follow the broadcast's limits, and every
// chosen project must be watched when the task is saved. A task repeats never, daily or weekly (CT-39).
import { err, getLocalDateTimeInstant, localDateTimeSchema, ok, type Clock, type Result } from "@softure-ai/core";
import type { Queryable } from "@softure-ai/db";
import { findRepositories } from "../../modules/projects/queries.ts";
import {
  findScheduledTask,
  insertScheduledTask,
  updateScheduledTask,
  type ScheduledTaskRepeat,
  type StoredScheduledTask,
} from "../../modules/projects/scheduled-tasks.ts";
import { MAX_BODY_LENGTH, MAX_TITLE_LENGTH } from "../broadcast/broadcast-limits.ts";
import type { ScheduledTaskErrorCode } from "./scheduled-task-errors.ts";

/** A time this far in the past is still accepted (the minute picked is the current one) and fires on the next tick. */
export const PAST_TIME_GRACE_MS = 60_000;

export interface ScheduledTaskContext {
  readonly db: Queryable;
  readonly clock: Clock;
  /** The app's time zone (`config.timezone`), in which the local time is read. */
  readonly timeZone: string;
}

export interface ScheduledTaskFields {
  readonly title: string;
  readonly prompt: string;
  /** `YYYY-MM-DDTHH:mm` in the app's time zone. */
  readonly runAt: string;
  readonly repositoryKeys: readonly string[];
  /** Once when not given. */
  readonly repeat?: ScheduledTaskRepeat;
}

export interface NewScheduledTaskInput extends ScheduledTaskFields {
  /** Made when the form was shown: a resubmitted form is the same task. */
  readonly id: string;
  readonly createdBy: string;
  /** The creator as people read it; the broadcast names them as its sender. */
  readonly createdByName: string;
}

interface CheckedFields {
  readonly title: string;
  readonly prompt: string;
  readonly runAt: Date;
  readonly repositoryKeys: string[];
  readonly repeat: ScheduledTaskRepeat;
}

function checkText(title: string, prompt: string): ScheduledTaskErrorCode | null {
  if (title === "") {
    return "scheduled.title_missing";
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return "scheduled.title_too_long";
  }
  if (prompt === "") {
    return "scheduled.prompt_missing";
  }
  return prompt.length > MAX_BODY_LENGTH ? "scheduled.prompt_too_long" : null;
}

/** The instant of the local time, or why it cannot be used. */
export function getRunInstant(value: string, timeZone: string, now: Date): Result<Date, ScheduledTaskErrorCode> {
  const parsed = localDateTimeSchema.safeParse(value);
  if (!parsed.success) {
    return err("scheduled.time_invalid");
  }
  const instant = getLocalDateTimeInstant(parsed.data, timeZone);
  if (instant.getTime() < now.getTime() - PAST_TIME_GRACE_MS) {
    return err("scheduled.time_past");
  }
  return ok(instant);
}

async function checkFields(context: ScheduledTaskContext, fields: ScheduledTaskFields): Promise<Result<CheckedFields, ScheduledTaskErrorCode>> {
  const title = fields.title.replace(/\s+/g, " ").trim();
  const prompt = fields.prompt.trim();
  const invalid = checkText(title, prompt);
  if (invalid !== null) {
    return err(invalid);
  }
  const keys = [...new Set(fields.repositoryKeys)];
  if (keys.length === 0) {
    return err("scheduled.no_projects");
  }
  const runAt = getRunInstant(fields.runAt, context.timeZone, context.clock.now());
  if (!runAt.ok) {
    return runAt;
  }
  const repositories = await findRepositories(context.db);
  if (!repositories.ok) {
    return err("scheduled.storage_failed");
  }
  const watched = new Set(repositories.value.map((repository) => repository.key));
  if (keys.some((key) => !watched.has(key))) {
    return err("scheduled.project_not_watched");
  }
  return ok({ title, prompt, runAt: runAt.value, repositoryKeys: keys, repeat: fields.repeat ?? "none" });
}

export async function createScheduledTask(
  context: ScheduledTaskContext,
  input: NewScheduledTaskInput,
): Promise<Result<StoredScheduledTask, ScheduledTaskErrorCode>> {
  const checked = await checkFields(context, input);
  if (!checked.ok) {
    return checked;
  }
  const saved = await insertScheduledTask(context.db, {
    id: input.id,
    ...checked.value,
    createdBy: input.createdBy,
    createdByName: input.createdByName === "" ? null : input.createdByName,
    at: context.clock.now(),
  });
  return saved.ok ? ok(saved.value) : err("scheduled.storage_failed");
}

/** Changes a task that has not fired yet; a task being sent, sent or failed is refused. */
export async function editScheduledTask(
  context: ScheduledTaskContext,
  id: string,
  fields: ScheduledTaskFields,
): Promise<Result<undefined, ScheduledTaskErrorCode>> {
  const existing = await findScheduledTask(context.db, id);
  if (!existing.ok) {
    return err("scheduled.storage_failed");
  }
  if (existing.value === null) {
    return err("scheduled.not_found");
  }
  if (existing.value.status !== "scheduled") {
    return err("scheduled.not_editable");
  }
  const checked = await checkFields(context, fields);
  if (!checked.ok) {
    return checked;
  }
  const updated = await updateScheduledTask(context.db, id, { ...checked.value, at: context.clock.now() });
  if (!updated.ok) {
    return err("scheduled.storage_failed");
  }
  // A tick may have claimed it between the read and the update.
  return updated.value ? ok(undefined) : err("scheduled.not_editable");
}
