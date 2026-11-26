// The team's members on Settings → Team, each in the theme's list row (CT-18, CT-26): the account on the left, its admin and
// "you" tags on top of the right column and, under them, a trash can for everyone but the signed-in admin.
// Removing asks in the shared confirmation dialog, since it ends the person's account.
import { Badge, List, ListEntry, ListItem } from "@softure-ai/theme-notion";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import { ConfirmDeleteButton } from "../shell/confirm-delete-button.tsx";
import type { Member } from "./members.ts";

export interface MemberListProps {
  readonly members: readonly Member[];
  readonly currentUserId: string;
  readonly copy: AppMessages["team"];
  readonly formatTime: (date: Date) => string;
  readonly removeAction: (formData: FormData) => Promise<void>;
}

export function MemberList({ members, currentUserId, copy, formatTime, removeAction }: MemberListProps) {
  return (
    <List aria-label={copy.membersLabel} density="roomy" className="border-y border-border">
      {members.map((member) => {
        const name = member.displayName ?? member.email;
        return (
          <ListItem key={member.id}>
            <ListEntry
              title={
                member.displayName === null ? (
                  name
                ) : (
                  // The email stands beside the name on its line.
                  <span className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="min-w-0 break-words">{name}</span>
                    <span className="truncate text-small font-normal text-muted-foreground">{member.email}</span>
                  </span>
                )
              }
              details={<p className="text-small text-muted-foreground">{fillMessage(copy.joinedAt, { time: formatTime(member.joinedAt) })}</p>}
              status={
                member.isAdmin || member.id === currentUserId ? (
                  <>
                    {member.isAdmin ? (
                      <Badge variant="tag" color="purple">
                        {copy.admin}
                      </Badge>
                    ) : null}
                    {member.id === currentUserId ? (
                      <Badge variant="tag" color="gray">
                        {copy.you}
                      </Badge>
                    ) : null}
                  </>
                ) : null
              }
              actions={
                member.id === currentUserId ? null : (
                  <ConfirmDeleteButton
                    copy={{
                      label: fillMessage(copy.removeLabel, { email: member.email }),
                      question: fillMessage(copy.removeQuestion, { email: member.email }),
                      hint: copy.removeHint,
                      delete: copy.remove,
                      deleting: copy.removing,
                      cancel: copy.cancel,
                    }}
                    fields={{ memberId: member.id }}
                    action={removeAction}
                  />
                )
              }
            />
          </ListItem>
        );
      })}
    </List>
  );
}
