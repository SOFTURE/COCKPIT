// The team's members on Settings → Team, each in the shared list row (CT-18): the account on the left, its admin and
// "you" tags on top of the right column and, under them, a trash can for everyone but the signed-in admin.
// Removing asks in the shared confirmation dialog, since it ends the person's account.
import { Badge } from "@softure-ai/theme-notion";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import { ConfirmDeleteButton } from "../shell/confirm-delete-button.tsx";
import { ListRow } from "../shell/list-row.tsx";
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
    <ul aria-label={copy.membersLabel} className="grid divide-y divide-border border-y border-border">
      {members.map((member) => {
        const name = member.displayName ?? member.email;
        return (
          <ListRow
            key={member.id}
            title={name}
            titleAside={member.displayName === null ? undefined : <span className="truncate text-small text-muted-foreground">{member.email}</span>}
            details={<p className="text-small text-muted-foreground">{fillMessage(copy.joinedAt, { time: formatTime(member.joinedAt) })}</p>}
            status={[
              member.isAdmin ? (
                <Badge key="admin" variant="tag" color="purple">
                  {copy.admin}
                </Badge>
              ) : null,
              member.id === currentUserId ? (
                <Badge key="you" variant="tag" color="gray">
                  {copy.you}
                </Badge>
              ) : null,
            ]}
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
        );
      })}
    </ul>
  );
}
