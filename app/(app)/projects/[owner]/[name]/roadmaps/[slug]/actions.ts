"use server";

// The roadmap view's promote action: the signed-in member promotes a queued roadmap, or one of its open items, to work;
// it becomes one cockpit issue in that project (the same single write as an answer, NFR-7).
import { requireUser } from "@softure-ai/auth/next";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fillMessage, getMessages } from "../../../../../../../messages/index.ts";
import config from "../../../../../../../softure.config.ts";
import { getForgeClient } from "../../../../../../../src/projects/forge-access.ts";
import { getWakeDependencies } from "../../../../../../../src/routines/wake-access.ts";
import { wakeAfterIssue } from "../../../../../../../src/routines/wake-issue.ts";
import { loadWatchedRepositories } from "../../../../../../../src/projects/load-repositories.ts";
import { loadRoadmapView } from "../../../../../../../src/roadmap/load-roadmap-view.ts";
import type { PromoteFormState } from "../../../../../../../src/roadmap/promote-form-state.ts";
import { promoteRoadmap, type PromoteErrorCode } from "../../../../../../../src/roadmap/promote-roadmap.ts";
import { getAnswererName } from "../../../../../../../src/team/answerer-name.ts";

const promoteFormSchema = z.object({
  repositoryKey: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  itemId: z.string().min(1).max(40).optional(),
});

/** The message key of each failure; the dictionary must hold every one, or this does not type-check. */
type PromoteErrorKey = PromoteErrorCode extends `promote.${infer Key}` ? Key : never;

export async function promoteRoadmapAction(_previous: PromoteFormState, formData: FormData): Promise<PromoteFormState> {
  const user = await requireUser();
  const copy = getMessages(config.locale).roadmapView.promote;
  const parsed = promoteFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "failed", message: copy.errors.invalid_request };
  }
  const repository = (await loadWatchedRepositories()).find((candidate) => candidate.key === parsed.data.repositoryKey);
  // The roadmap is read again now: the item must still be open in the file the project has today.
  const loaded = repository === undefined ? null : await loadRoadmapView(repository, parsed.data.slug);
  if (repository === undefined || loaded === null) {
    return { status: "failed", message: copy.errors.not_queued };
  }
  const result = await promoteRoadmap({
    client: getForgeClient(),
    fullName: repository.fullName,
    view: loaded.view,
    itemId: parsed.data.itemId ?? null,
    requestedByName: getAnswererName(user),
  });
  if (!result.ok) {
    // Every code starts with `promote.` (PromoteErrorCode).
    const key = result.error.slice("promote.".length) as PromoteErrorKey;
    return { status: "failed", message: copy.errors[key] };
  }
  if (!result.value.alreadyPromoted) {
    // The issue exists first; its fires show on the project's Routines tab with a Retry (CT-10).
    await wakeAfterIssue(await getWakeDependencies(), {
      repositoryKey: repository.key,
      fullName: repository.fullName,
      number: result.value.issueNumber,
      url: result.value.issueUrl,
      title: result.value.issueTitle,
    });
  }
  revalidatePath(`/projects/${repository.fullName}/roadmaps/${parsed.data.slug}`);
  const template = result.value.alreadyPromoted ? copy.alreadySent : copy.sentNow;
  return { status: "sent", message: fillMessage(template, { number: result.value.issueNumber }), issueUrl: result.value.issueUrl, issueNumber: result.value.issueNumber };
}
