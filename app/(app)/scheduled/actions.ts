"use server";

// The scheduled tasks' actions (CT-36): create, edit, delete and run now. Each checks the signed-in member first (every
// member may broadcast, FR-16) and narrows its input with zod; the screens come in CT-37 and CT-38.
import { requireUser } from "@softure-ai/auth/next";
import { systemClock } from "@softure-ai/core";
import { createLogger } from "@softure-ai/observability";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getMessages } from "../../../messages/index.ts";
import config from "../../../softure.config.ts";
import { MAX_BODY_LENGTH, MAX_TITLE_LENGTH } from "../../../src/broadcast/broadcast-limits.ts";
import { getDatabase } from "../../../src/database.ts";
import { removeScheduledTask } from "../../../src/scheduled/delete-scheduled-task.ts";
import { runScheduledTaskNow } from "../../../src/scheduled/run-scheduled-task.ts";
import { createScheduledTask, editScheduledTask, type ScheduledTaskContext } from "../../../src/scheduled/save-scheduled-task.ts";
import { getScheduledRunDependencies } from "../../../src/scheduled/scheduled-run-access.ts";
import type { ScheduledTaskActionState } from "../../../src/scheduled/scheduled-task-action-state.ts";
import type { ScheduledTaskErrorCode } from "../../../src/scheduled/scheduled-task-errors.ts";
import { getAnswererName } from "../../../src/team/answerer-name.ts";

const SCHEDULED_PATH = "/scheduled";

const fieldsSchema = z.object({
  // Longer text is refused by the rule with its own message.
  title: z.string().max(MAX_TITLE_LENGTH * 2),
  prompt: z.string().max(MAX_BODY_LENGTH * 2),
  runAt: z.string().max(32),
  projects: z.array(z.string().min(1).max(200)).max(500),
});

const taskIdSchema = z.object({ taskId: z.uuid() });

const logger = createLogger("scheduled");

/** The message key of each failure; the dictionary must hold every one, or this does not type-check. */
type ScheduledErrorKey = ScheduledTaskErrorCode extends `scheduled.${infer Key}` ? Key : never;

function toFailure(code: ScheduledTaskErrorCode): ScheduledTaskActionState {
  // Every code starts with `scheduled.` (ScheduledTaskErrorCode).
  const key = code.slice("scheduled.".length) as ScheduledErrorKey;
  return { status: "failed", message: getMessages(config.locale).scheduled.errors[key] };
}

function invalidRequest(): ScheduledTaskActionState {
  return { status: "failed", message: getMessages(config.locale).scheduled.errors.invalid_request };
}

function readFields(formData: FormData) {
  return fieldsSchema.safeParse({
    title: formData.get("title"),
    prompt: formData.get("prompt"),
    runAt: formData.get("runAt"),
    projects: formData.getAll("project"),
  });
}

async function getContext(): Promise<ScheduledTaskContext> {
  const { db } = await getDatabase();
  return { db, clock: systemClock, timeZone: config.timezone };
}

export async function createScheduledTaskAction(_previous: ScheduledTaskActionState, formData: FormData): Promise<ScheduledTaskActionState> {
  const user = await requireUser();
  const id = taskIdSchema.safeParse({ taskId: formData.get("taskId") });
  const fields = readFields(formData);
  if (!id.success || !fields.success) {
    return invalidRequest();
  }
  const result = await createScheduledTask(await getContext(), {
    id: id.data.taskId,
    title: fields.data.title,
    prompt: fields.data.prompt,
    runAt: fields.data.runAt,
    repositoryKeys: fields.data.projects,
    createdBy: user.id,
    createdByName: getAnswererName(user),
  });
  if (!result.ok) {
    logger.warn("scheduled task refused", { user_id: user.id, task: id.data.taskId, code: result.error });
    return toFailure(result.error);
  }
  logger.info("scheduled task created", { user_id: user.id, task: id.data.taskId, run_at: result.value.runAt.toISOString() });
  revalidatePath(SCHEDULED_PATH, "layout");
  return { status: "saved" };
}

export async function editScheduledTaskAction(_previous: ScheduledTaskActionState, formData: FormData): Promise<ScheduledTaskActionState> {
  const user = await requireUser();
  const id = taskIdSchema.safeParse({ taskId: formData.get("taskId") });
  const fields = readFields(formData);
  if (!id.success || !fields.success) {
    return invalidRequest();
  }
  const result = await editScheduledTask(await getContext(), id.data.taskId, {
    title: fields.data.title,
    prompt: fields.data.prompt,
    runAt: fields.data.runAt,
    repositoryKeys: fields.data.projects,
  });
  if (!result.ok) {
    logger.warn("scheduled task edit refused", { user_id: user.id, task: id.data.taskId, code: result.error });
    return toFailure(result.error);
  }
  logger.info("scheduled task edited", { user_id: user.id, task: id.data.taskId });
  revalidatePath(SCHEDULED_PATH, "layout");
  return { status: "saved" };
}

/** Removes a task; a sent task's broadcast and issues stay in Broadcast history. */
export async function deleteScheduledTaskAction(formData: FormData): Promise<ScheduledTaskActionState> {
  const user = await requireUser();
  const id = taskIdSchema.safeParse({ taskId: formData.get("taskId") });
  if (!id.success) {
    return invalidRequest();
  }
  const { db } = await getDatabase();
  const result = await removeScheduledTask(db, id.data.taskId);
  if (!result.ok) {
    logger.warn("scheduled task delete refused", { user_id: user.id, task: id.data.taskId, code: result.error });
    return toFailure(result.error);
  }
  logger.info("scheduled task deleted", { user_id: user.id, task: id.data.taskId, deleted: result.value });
  revalidatePath(SCHEDULED_PATH, "layout");
  return { status: "saved" };
}

/** Sends a scheduled task at once through the same claim and send as the schedule. */
export async function runScheduledTaskNowAction(formData: FormData): Promise<ScheduledTaskActionState> {
  const user = await requireUser();
  const id = taskIdSchema.safeParse({ taskId: formData.get("taskId") });
  if (!id.success) {
    return invalidRequest();
  }
  const result = await runScheduledTaskNow(await getScheduledRunDependencies(), id.data.taskId);
  if (!result.ok) {
    logger.warn("scheduled task run refused", { user_id: user.id, task: id.data.taskId, code: result.error });
    return toFailure(result.error);
  }
  logger.info("scheduled task run now", { user_id: user.id, task: id.data.taskId, outcome: result.value.kind });
  revalidatePath(SCHEDULED_PATH, "layout");
  revalidatePath("/broadcast", "layout");
  return { status: "saved" };
}
