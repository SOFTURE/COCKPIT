"use server";

// The Settings screen's actions on watched repositories. Each one checks the signed-in owner first.
import { requireUser } from "@softure-ai/auth/next";
import { systemClock } from "@softure-ai/core";
import { revalidatePath } from "next/cache";
import { fillMessage, getMessages } from "../../../messages/index.ts";
import config from "../../../softure.config.ts";
import { getDatabase } from "../../../src/database.ts";
import { addRepository, removeRepository } from "../../../src/projects/add-repository.ts";
import type { AddRepositoryFormState } from "../../../src/projects/add-repository-form.tsx";
import { getForgeClient } from "../../../src/projects/forge-access.ts";
import { describeErrorCode, describePermissions } from "../../../src/projects/repository-copy.ts";

export async function addRepositoryAction(_previous: AddRepositoryFormState, formData: FormData): Promise<AddRepositoryFormState> {
  await requireUser();
  const copy = getMessages(config.locale).repositories;
  const input = formData.get("repository");
  const value = typeof input === "string" ? input : "";
  const { db } = await getDatabase();
  const result = await addRepository({ db, client: getForgeClient(), clock: systemClock, input: value });
  if (!result.ok) {
    const message = fillMessage(describeErrorCode(copy, result.error), {
      permissions: describePermissions(copy, result.missing),
    });
    return { status: "failed", message, value };
  }
  revalidatePath("/", "layout");
  return { status: "added", message: fillMessage(copy.added, { name: result.value.fullName }), value: "" };
}

export async function removeRepositoryAction(formData: FormData): Promise<void> {
  await requireUser();
  const input = formData.get("repository");
  if (typeof input !== "string") {
    return;
  }
  const { db } = await getDatabase();
  const removed = await removeRepository(db, input);
  if (!removed.ok) {
    throw new Error(`removeRepositoryAction: removing a watched repository failed (${removed.error})`);
  }
  revalidatePath("/", "layout");
}
