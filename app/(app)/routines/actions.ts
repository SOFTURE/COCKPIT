"use server";

// A project's routines (CT-10): add, replace the token, enable or disable, delete and Test, plus Retry waking one
// issue from the broadcast page, the inbox or the Routines tab. Each action checks the signed-in member first and the
// project against the watched ones. A token goes from the form to the token box only: never into a log, an error or
// the form's answer.
import { requireUser } from "@softure-ai/auth/next";
import { systemClock } from "@softure-ai/core";
import { createLogger } from "@softure-ai/observability";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fillMessage, getMessages } from "../../../messages/index.ts";
import config from "../../../softure.config.ts";
import { getDatabase } from "../../../src/database.ts";
import { loadWatchedRepositories } from "../../../src/projects/load-repositories.ts";
import {
  addProjectRoutine,
  removeRoutine,
  replaceRoutineToken,
  setRoutineEnabled,
  testRoutine,
  type ManageContext,
  type RoutineErrorCode,
} from "../../../src/routines/manage-routines.ts";
import type { RoutineFormState } from "../../../src/routines/routine-form-state.ts";
import { createRoutinesApi, getRoutinesApiUrl } from "../../../src/routines/routines-api.ts";
import { getTokenBox, getWakeDependencies } from "../../../src/routines/wake-access.ts";
import { retryIssueWakeByNumber } from "../../../src/routines/wake-issue.ts";

const retryFormSchema = z.object({ repositoryKey: z.string().min(1).max(200), issueNumber: z.coerce.number().int().positive() });
const routineRefSchema = z.object({ repositoryKey: z.string().min(1).max(200), routineId: z.coerce.number().int().positive() });
const addFormSchema = z.object({
  repositoryKey: z.string().min(1).max(200),
  name: z.string().max(400),
  kind: z.string().max(100),
  trigger: z.string().max(1000),
  token: z.string().max(8192),
  enabled: z.boolean(),
});
const tokenFormSchema = routineRefSchema.extend({ token: z.string().max(8192) });
const enabledFormSchema = routineRefSchema.extend({ enabled: z.enum(["true", "false"]) });

const logger = createLogger("routines");

function getCopy() {
  return getMessages(config.locale).routines;
}

function failed(message: string): RoutineFormState {
  return { status: "failed", message };
}

function failedWith(code: RoutineErrorCode | "routines.invalid_request"): RoutineFormState {
  const key = code.slice("routines.".length) as keyof ReturnType<typeof getCopy>["errors"];
  return failed(getCopy().errors[key]);
}

function readText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

async function isWatched(repositoryKey: string): Promise<boolean> {
  return (await loadWatchedRepositories()).some((repository) => repository.key === repositoryKey);
}

async function getContext(): Promise<ManageContext> {
  const { db } = await getDatabase();
  return { db, clock: systemClock, box: getTokenBox() };
}

function refresh(): void {
  // The overview's chip and the project's tab read the routines.
  revalidatePath("/", "layout");
}

export async function addRoutineAction(_previous: RoutineFormState, formData: FormData): Promise<RoutineFormState> {
  await requireUser();
  const parsed = addFormSchema.safeParse({
    repositoryKey: readText(formData, "repositoryKey"),
    name: readText(formData, "name"),
    kind: readText(formData, "kind"),
    trigger: readText(formData, "trigger"),
    token: readText(formData, "token"),
    // A new routine starts enabled; its row's switch turns it off.
    enabled: true,
  });
  if (!parsed.success || !(await isWatched(parsed.data.repositoryKey))) {
    return failedWith("routines.invalid_request");
  }
  const added = await addProjectRoutine(await getContext(), parsed.data);
  if (!added.ok) {
    return failedWith(added.error);
  }
  refresh();
  return { status: "done", message: getCopy().saved };
}

export async function replaceRoutineTokenAction(_previous: RoutineFormState, formData: FormData): Promise<RoutineFormState> {
  await requireUser();
  const parsed = tokenFormSchema.safeParse({
    repositoryKey: readText(formData, "repositoryKey"),
    routineId: readText(formData, "routineId"),
    token: readText(formData, "token"),
  });
  if (!parsed.success) {
    return failedWith("routines.invalid_request");
  }
  const replaced = await replaceRoutineToken(await getContext(), parsed.data.repositoryKey, parsed.data.routineId, parsed.data.token);
  if (!replaced.ok) {
    return failedWith(replaced.error);
  }
  refresh();
  return { status: "done", message: getCopy().saved };
}

export async function testRoutineAction(_previous: RoutineFormState, formData: FormData): Promise<RoutineFormState> {
  await requireUser();
  const parsed = routineRefSchema.safeParse({ repositoryKey: readText(formData, "repositoryKey"), routineId: readText(formData, "routineId") });
  if (!parsed.success) {
    return failedWith("routines.invalid_request");
  }
  const context = { ...(await getContext()), api: createRoutinesApi({ baseUrl: getRoutinesApiUrl(process.env) }) };
  const tested = await testRoutine(context, parsed.data.repositoryKey, parsed.data.routineId);
  if (!tested.ok) {
    return failedWith(tested.error);
  }
  refresh();
  const copy = getCopy();
  const outcome = tested.value;
  if (outcome.kind === "sent") {
    return { status: "done", message: fillMessage(copy.testSent, { status: outcome.status }) };
  }
  const wakeCopy = getMessages(config.locale).wake;
  const reason = wakeCopy.reasons[outcome.reason];
  const status = outcome.status === null ? reason : `${fillMessage(wakeCopy.httpStatus, { status: outcome.status })} · ${reason}`;
  return failed(fillMessage(copy.testFailed, { reason: status }));
}

export async function setRoutineEnabledAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = enabledFormSchema.safeParse({
    repositoryKey: readText(formData, "repositoryKey"),
    routineId: readText(formData, "routineId"),
    enabled: readText(formData, "enabled"),
  });
  if (!parsed.success) {
    return;
  }
  const changed = await setRoutineEnabled(await getContext(), parsed.data.repositoryKey, parsed.data.routineId, parsed.data.enabled === "true");
  if (!changed.ok) {
    logger.warn("routine change refused", { user_id: user.id, repository: parsed.data.repositoryKey, routine_id: parsed.data.routineId, code: changed.error });
    if (changed.error === "routines.storage_failed") {
      throw new Error(`setRoutineEnabledAction: changing routine ${String(parsed.data.routineId)} failed (${changed.error})`);
    }
  }
  refresh();
}

export async function deleteRoutineAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = routineRefSchema.safeParse({ repositoryKey: readText(formData, "repositoryKey"), routineId: readText(formData, "routineId") });
  if (!parsed.success) {
    return;
  }
  const deleted = await removeRoutine(await getContext(), parsed.data.repositoryKey, parsed.data.routineId);
  if (!deleted.ok) {
    logger.warn("routine delete refused", { user_id: user.id, repository: parsed.data.repositoryKey, routine_id: parsed.data.routineId, code: deleted.error });
    if (deleted.error === "routines.storage_failed") {
      throw new Error(`deleteRoutineAction: deleting routine ${String(parsed.data.routineId)} failed (${deleted.error})`);
    }
  }
  refresh();
}

export async function retryIssueWakeAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = retryFormSchema.safeParse({ repositoryKey: formData.get("repositoryKey"), issueNumber: formData.get("issueNumber") });
  if (!parsed.success) {
    return;
  }
  const result = await retryIssueWakeByNumber(await getWakeDependencies(), parsed.data.repositoryKey, parsed.data.issueNumber);
  if (!result.ok) {
    logger.warn("issue wake retry refused", { user_id: user.id, repository: parsed.data.repositoryKey, issue: parsed.data.issueNumber, code: result.error });
    if (result.error === "wake.storage_failed") {
      throw new Error(`retryIssueWakeAction: retrying the wake of an issue failed (${result.error})`);
    }
  }
  // The new fire states show wherever the issue is listed.
  refresh();
}
