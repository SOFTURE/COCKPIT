// Settings → Team (FR-16): the members, with remove, and auth's invitation panel. Admin only: anyone else gets
// Next's "not found", so the screen does not reveal that it exists.
import { ADMIN_ROLE } from "@softure-ai/auth";
import { getAuthMessages, inviteAction, requireRole, resendInvitationAction, revokeInvitationAction, toInvitationRow } from "@softure-ai/auth/next";
import { listInvitations } from "@softure-ai/auth/server";
import { InvitationPanel } from "@softure-ai/auth/ui";
import { systemClock } from "@softure-ai/core";
import { Alert, AlertDescription, PageHeader } from "@softure-ai/theme-notion";
import Link from "next/link";
import { connection } from "next/server";
import { getMessages } from "../../../../messages/index.ts";
import config from "../../../../softure.config.ts";
import { getDatabase } from "../../../../src/database.ts";
import { createTimeFormatter } from "../../../../src/projects/format-time.ts";
import { MemberList } from "../../../../src/team/member-list.tsx";
import { listMembers } from "../../../../src/team/members.ts";
import { TEAM_NOTICE_PARAM } from "../../../../src/team/team-notice.ts";
import { removeMemberAction } from "./actions.ts";

const INVITATION_NOTICES = ["sent", "resent", "revoked"] as const;
type InvitationNotice = (typeof INVITATION_NOTICES)[number];
const TEAM_ERRORS = ["cannot_remove_yourself", "member_not_found", "storage_failed"] as const;
type TeamError = (typeof TEAM_ERRORS)[number];

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(params: Record<string, string | string[] | undefined>, name: string): string | undefined {
  const value = params[name];
  return typeof value === "string" ? value : undefined;
}

export default async function TeamPage({ searchParams }: { readonly searchParams: SearchParams }) {
  const admin = await requireRole(ADMIN_ROLE);
  await connection();
  const messages = getMessages(config.locale);
  const copy = messages.team;
  const authMessages = getAuthMessages(config);
  const { db } = await getDatabase();
  const [members, invitations, params] = await Promise.all([listMembers(db), listInvitations({ db, clock: systemClock, config }), searchParams]);
  if (!members.ok) {
    throw new Error("TeamPage: listing the team's members failed");
  }
  const invitationNotice = INVITATION_NOTICES.find((notice): notice is InvitationNotice => notice === readParam(params, "notice"));
  const teamNotice = readParam(params, TEAM_NOTICE_PARAM);
  const teamError = TEAM_ERRORS.find((code): code is TeamError => code === teamNotice);
  const formatTime = createTimeFormatter(config.locale, config.timezone);
  return (
    <>
      <PageHeader title={copy.title} description={copy.description} />
      <p className="text-small">
        <Link href="/settings" className="underline underline-offset-2">
          {copy.back}
        </Link>
      </p>
      {teamNotice === "removed" ? (
        <Alert className="mt-3">
          <AlertDescription>{copy.removedNotice}</AlertDescription>
        </Alert>
      ) : null}
      {teamError === undefined ? null : (
        <Alert variant="destructive" className="mt-3">
          <AlertDescription>{copy.errors[teamError]}</AlertDescription>
        </Alert>
      )}
      <section aria-labelledby="members-heading" className="grid gap-3 py-4">
        <h2 id="members-heading" className="text-heading-3">
          {copy.membersHeading}
        </h2>
        <MemberList members={members.value} currentUserId={admin.id} copy={copy} formatTime={formatTime} removeAction={removeMemberAction} />
      </section>
      <section aria-labelledby="invite-heading" className="grid gap-3 py-4">
        <div className="grid gap-1">
          <h2 id="invite-heading" className="text-heading-3">
            {copy.inviteHeading}
          </h2>
          <p className="text-small text-muted-foreground">{copy.inviteHint}</p>
        </div>
        <InvitationPanel
          rows={invitations.map((view) => toInvitationRow(view, authMessages, config))}
          roles={[ADMIN_ROLE]}
          inviteAction={inviteAction}
          resendAction={resendInvitationAction}
          revokeAction={revokeInvitationAction}
          messages={authMessages}
          notice={invitationNotice === undefined ? undefined : (authMessages.invitations?.[invitationNotice] ?? undefined)}
          locale={config.locale}
        />
      </section>
    </>
  );
}
