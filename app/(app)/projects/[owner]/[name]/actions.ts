"use server";

// The project page's own actions (CT-31): the Settings tab puts the project into one of the owner's groups.
import { requireUser } from "@softure-ai/auth/next";
import { createLogger } from "@softure-ai/observability";
import { revalidatePath } from "next/cache";
import { getMessages } from "../../../../../messages/index.ts";
import config from "../../../../../softure.config.ts";
import { getDatabase } from "../../../../../src/database.ts";
import type { ProjectGroupSaveResult } from "../../../../../src/project-page/project-group-select.tsx";
import { setProjectGroup } from "../../../../../src/project-page/set-project-group.ts";

const logger = createLogger("project-page");

/** Puts a watched project (`repositoryKey`) into a group (`groupId`), or into No group when `groupId` is empty. */
export async function setProjectGroupAction(formData: FormData): Promise<ProjectGroupSaveResult> {
  const result = await setProjectGroup({ requireUser, getDb: async () => (await getDatabase()).db }, formData);
  if (!result.ok) {
    logger.warn("setting a project's group refused", { user_id: result.userId, code: result.error });
    const errors = getMessages(config.locale).projectSettings.errors;
    return { ok: false, message: result.error === "unexpected" ? errors.unexpected : errors.not_found };
  }
  logger.info("project group set", { user_id: result.userId, repository: result.repositoryKey, group_id: result.groupId });
  // Every grouped surface (projects list, sidebar, pickers) reads the group on its next render.
  revalidatePath("/", "layout");
  return { ok: true, message: "" };
}
