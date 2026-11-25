// The team's members on Settings → Team: each account with its admin mark, and a trash can on the right for everyone
// but the signed-in admin. Removing asks in the shared confirmation dialog, since it ends the person's account.
import { Badge } from "@softure-ai/theme-notion";
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
    <ul aria-label={copy.membersLabel} className="grid divide-y divide-border border-y border-border">
      {members.map((member) => {
        const name = member.displayName ?? member.email;
        return (
          <li key={member.id} className="flex items-start justify-between gap-3 py-2">
            <div className="grid min-w-0 flex-1 gap-1">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="truncate font-medium">{name}</span>
                {member.displayName === null ? null : <span className="truncate text-small text-muted-foreground">{member.email}</span>}
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
              </div>
              <p className="text-small text-muted-foreground">{fillMessage(copy.joinedAt, { time: formatTime(member.joinedAt) })}</p>
            </div>
            {member.id === currentUserId ? null : (
              <div className="shrink-0">
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
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
