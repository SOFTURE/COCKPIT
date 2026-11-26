"use server";

// The Settings screen's actions on watched repositories and project groups (CT-30). Each one checks the signed-in
// owner first.
import { requireUser } from "@softure-ai/auth/next";
import { systemClock } from "@softure-ai/core";
import { createLogger } from "@softure-ai/observability";
import { revalidatePath } from "next/cache";
import { fillMessage, getMessages } from "../../../messages/index.ts";
import config from "../../../softure.config.ts";
import { getDatabase } from "../../../src/database.ts";
import { deleteProjectGroup, insertProjectGroup, renameProjectGroup } from "../../../modules/projects/groups.ts";
import { addRepository, removeRepository } from "../../../src/projects/add-repository.ts";
import { describeProjectGroupError, type ProjectGroupFailure } from "../../../src/projects/project-group-copy.ts";
import type { ProjectGroupFormState } from "../../../src/projects/project-group-form-state.ts";
import { parseGroupId, parseProjectGroupInput } from "../../../src/projects/project-group-input.ts";
import type { AddRepositoryFormState } from "../../../src/projects/add-repository-form.tsx";
import { getForgeClient } from "../../../src/projects/forge-access.ts";
import { refreshRepositorySuggestions } from "../../../src/projects/load-repository-suggestions.ts";
import { queueScan } from "../../../src/scan/queue-scan.ts";
import { describeErrorCode, describePermissions } from "../../../src/projects/repository-copy.ts";

const logger = createLogger("settings");

export async function addRepositoryAction(_previous: AddRepositoryFormState, formData: FormData): Promise<AddRepositoryFormState> {
  const user = await requireUser();
  const copy = getMessages(config.locale).repositories;
  const input = formData.get("repository");
  const value = typeof input === "string" ? input : "";
  const { db } = await getDatabase();
  const result = await addRepository({ db, client: getForgeClient(), clock: systemClock, input: value });
  if (!result.ok) {
    // The typed text may be anything: only the failure code and the owner the forge named are logged.
    logger.warn("adding a watched repository refused", { user_id: user.id, code: result.error, missing: result.missing.length });
    const message = fillMessage(describeErrorCode(copy, result.error), {
      permissions: describePermissions(copy, result.missing),
      owner: result.owner ?? "",
    });
    return { status: "failed", message, value };
  }
  logger.info("watched repository added", { user_id: user.id, repository: result.value.fullName });
  // The first read comes now instead of at the next period. A failed queue is left to the next scheduled scan on
  // purpose: the repository is already watched and adding it succeeded.
  await queueScan({ db, clock: systemClock, config }, "repository_added");
  revalidatePath("/", "layout");
  return { status: "added", message: fillMessage(copy.added, { name: result.value.fullName }), value: "" };
}

export async function removeRepositoryAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const input = formData.get("repository");
  if (typeof input !== "string") {
    return;
  }
  const { db } = await getDatabase();
  const removed = await removeRepository(db, input);
  if (!removed.ok) {
    logger.error("removing a watched repository failed", { user_id: user.id, code: removed.error });
    throw new Error(`removeRepositoryAction: removing a watched repository failed (${removed.error})`);
  }
  logger.info("watched repository removed", { user_id: user.id, repository: input });
  revalidatePath("/", "layout");
}

/** Rereads the repositories the access token can read (the refresh next to the picker on Settings). */
export async function refreshRepositoryListAction(): Promise<void> {
  const user = await requireUser();
  await refreshRepositorySuggestions();
  logger.info("repository suggestions refreshed", { user_id: user.id });
  revalidatePath("/settings");
}

function readFormText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

/** The answer to a refused group form: the message, the field it is about, and what was typed. */
function refuseGroupForm(formData: FormData, error: ProjectGroupFailure): ProjectGroupFormState {
  const copy = getMessages(config.locale).projectGroups;
  const field = error === "projects.group_name_taken" ? "name" : error === "projects.group_owner_taken" ? "owner" : null;
  return { status: "failed", message: describeProjectGroupError(copy, error), field, values: readGroupValues(formData) };
}

function readGroupValues(formData: FormData): ProjectGroupFormState["values"] {
  return { name: readFormText(formData, "name"), owner: readFormText(formData, "owner") };
}

/** Narrows a group form; a field it refuses comes back as that field's error. */
function parseGroupForm(formData: FormData) {
  const parsed = parseProjectGroupInput(formData);
  if (parsed.ok) {
    return parsed;
  }
  const copy = getMessages(config.locale).projectGroups;
  const state: ProjectGroupFormState = {
    status: "failed",
    message: copy.errors[parsed.error.code],
    field: parsed.error.field,
    values: readGroupValues(formData),
  };
  return { ok: false as const, state };
}

export async function addProjectGroupAction(_previous: ProjectGroupFormState, formData: FormData): Promise<ProjectGroupFormState> {
  const user = await requireUser();
  const parsed = parseGroupForm(formData);
  if (!parsed.ok) {
    return parsed.state;
  }
  const { db } = await getDatabase();
  const added = await insertProjectGroup(db, parsed.value);
  if (!added.ok) {
    logger.warn("adding a project group refused", { user_id: user.id, code: added.error });
    return refuseGroupForm(formData, added.error);
  }
  logger.info("project group added", { user_id: user.id, group_id: added.value.id });
  revalidatePath("/", "layout");
  const copy = getMessages(config.locale).projectGroups;
  return { status: "done", message: fillMessage(copy.added, { name: added.value.name }), field: null, values: { name: "", owner: "" } };
}

export async function renameProjectGroupAction(_previous: ProjectGroupFormState, formData: FormData): Promise<ProjectGroupFormState> {
  const user = await requireUser();
  const groupId = parseGroupId(formData);
  if (groupId === null) {
    return refuseGroupForm(formData, "projects.group_invalid");
  }
  const parsed = parseGroupForm(formData);
  if (!parsed.ok) {
    return parsed.state;
  }
  const { db } = await getDatabase();
  const renamed = await renameProjectGroup(db, groupId, parsed.value);
  if (!renamed.ok) {
    logger.warn("renaming a project group refused", { user_id: user.id, group_id: groupId, code: renamed.error });
    return refuseGroupForm(formData, renamed.error);
  }
  logger.info("project group renamed", { user_id: user.id, group_id: groupId });
  revalidatePath("/", "layout");
  const copy = getMessages(config.locale).projectGroups;
  return { status: "done", message: fillMessage(copy.saved, { name: renamed.value.name }), field: null, values: readGroupValues(formData) };
}

/** Deletes a group; its projects fall to No group. A group already gone counts as deleted. */
export async function deleteProjectGroupAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const groupId = parseGroupId(formData);
  if (groupId === null) {
    return;
  }
  const { db } = await getDatabase();
  const deleted = await deleteProjectGroup(db, groupId);
  if (!deleted.ok && deleted.error !== "projects.group_not_found") {
    logger.error("deleting a project group failed", { user_id: user.id, group_id: groupId, code: deleted.error });
    throw new Error(`deleteProjectGroupAction: deleting a project group failed (${deleted.error})`);
  }
  logger.info("project group deleted", { user_id: user.id, group_id: groupId });
  revalidatePath("/", "layout");
}
