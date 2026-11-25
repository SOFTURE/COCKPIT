"use server";

// The broadcast screen's actions (CV-1): send one broadcast to the picked projects, and retry one project's send. Each
// checks the signed-in member first.
import { requireUser } from "@softure-ai/auth/next";
import { systemClock } from "@softure-ai/core";
import { createLogger } from "@softure-ai/observability";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getMessages } from "../../../messages/index.ts";
import config from "../../../softure.config.ts";
import type { BroadcastFormState } from "../../../src/broadcast/broadcast-form-state.ts";
import { MAX_BODY_LENGTH, MAX_TITLE_LENGTH } from "../../../src/broadcast/broadcast-limits.ts";
import { retryBroadcastSend, sendBroadcast, type BroadcastErrorCode } from "../../../src/broadcast/send-broadcast.ts";
import { getDatabase } from "../../../src/database.ts";
import { getForgeClient } from "../../../src/projects/forge-access.ts";
import { getWakeDependencies } from "../../../src/routines/wake-access.ts";
import { getAnswererName } from "../../../src/team/answerer-name.ts";

const broadcastFormSchema = z.object({
  broadcastId: z.uuid(),
  // Longer text is refused by the rule with its own message.
  title: z.string().max(MAX_TITLE_LENGTH * 2),
  body: z.string().max(MAX_BODY_LENGTH * 2),
  projects: z.array(z.string().min(1).max(200)).max(500),
});

const retryFormSchema = z.object({ broadcastId: z.uuid(), repository: z.string().min(1).max(200) });

const logger = createLogger("broadcast");

/** The message key of each failure; the dictionary must hold every one, or this does not type-check. */
type BroadcastErrorKey = BroadcastErrorCode extends `broadcast.${infer Key}` ? Key : never;

export async function sendBroadcastAction(_previous: BroadcastFormState, formData: FormData): Promise<BroadcastFormState> {
  const user = await requireUser();
  const copy = getMessages(config.locale).broadcast;
  const parsed = broadcastFormSchema.safeParse({
    broadcastId: formData.get("broadcastId"),
    title: formData.get("title"),
    body: formData.get("body"),
    projects: formData.getAll("project"),
  });
  if (!parsed.success) {
    return { status: "failed", message: copy.errors.invalid_request };
  }
  const { db } = await getDatabase();
  const result = await sendBroadcast({
    db,
    client: getForgeClient(),
    clock: systemClock,
    id: parsed.data.broadcastId,
    title: parsed.data.title,
    body: parsed.data.body,
    repositoryKeys: parsed.data.projects,
    sentBy: user.id,
    sentByName: getAnswererName(user),
    wake: await getWakeDependencies(),
  });
  if (!result.ok) {
    logger.warn("broadcast refused", { user_id: user.id, broadcast: parsed.data.broadcastId, code: result.error });
    // Every code starts with `broadcast.` (BroadcastErrorCode).
    const key = result.error.slice("broadcast.".length) as BroadcastErrorKey;
    return { status: "failed", message: copy.errors[key] };
  }
  revalidatePath("/broadcast", "layout");
  redirect(`/broadcast/${result.value.id}`);
}

export async function retryBroadcastSendAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = retryFormSchema.safeParse({ broadcastId: formData.get("broadcastId"), repository: formData.get("repository") });
  if (!parsed.success) {
    return;
  }
  const { db } = await getDatabase();
  const result = await retryBroadcastSend({
    db,
    client: getForgeClient(),
    clock: systemClock,
    broadcastId: parsed.data.broadcastId,
    repositoryKey: parsed.data.repository,
    wake: await getWakeDependencies(),
  });
  if (!result.ok && result.error === "broadcast.storage_failed") {
    logger.error("broadcast retry failed", { user_id: user.id, broadcast: parsed.data.broadcastId, code: result.error });
    throw new Error(`retryBroadcastSendAction: retrying a broadcast send failed (${result.error})`);
  }
  if (!result.ok) {
    // No forge token, or a broadcast or project the page no longer matches: the send stays as it was.
    logger.warn("broadcast retry refused", {
      user_id: user.id,
      broadcast: parsed.data.broadcastId,
      repository: parsed.data.repository,
      code: result.error,
    });
  }
  // A failed retry keeps its new reason on the send; the page shows it.
  revalidatePath(`/broadcast/${parsed.data.broadcastId}`);
}
