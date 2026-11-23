"use server";

// Settings → Team: removing a teammate (FR-16). Inviting, resending and revoking are auth's own actions.
import { ADMIN_ROLE } from "@softure-ai/auth";
import { authorizeRole } from "@softure-ai/auth/next";
import { systemClock } from "@softure-ai/core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import config, { TEAM_PATH } from "../../../../softure.config.ts";
import { getDatabase } from "../../../../src/database.ts";
import { removeMember } from "../../../../src/team/members.ts";
import { TEAM_NOTICE_PARAM } from "../../../../src/team/team-notice.ts";

const removeFormSchema = z.object({ memberId: z.uuid() });

export async function removeMemberAction(formData: FormData): Promise<void> {
  const admin = await authorizeRole(ADMIN_ROLE);
  if (!admin.ok) {
    redirect("/");
  }
  const parsed = removeFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`${TEAM_PATH}?${TEAM_NOTICE_PARAM}=member_not_found`);
  }
  const { db } = await getDatabase();
  const removed = await removeMember({ db, clock: systemClock, config }, { actorId: admin.value.id, memberId: parsed.data.memberId });
  revalidatePath("/", "layout");
  redirect(`${TEAM_PATH}?${TEAM_NOTICE_PARAM}=${removed.ok ? "removed" : removed.error.slice("team.".length)}`);
}
