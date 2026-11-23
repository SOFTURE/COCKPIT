// The team's members on Settings → Team: each account with its admin mark, and a remove step for everyone but the
// signed-in admin. Removing asks once more (a disclosure, no script), since it ends the person's account.
import { Badge, Button } from "@softure-ai/theme-notion";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
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
          <li key={member.id} className="grid gap-1 py-2">
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
            {member.id === currentUserId ? null : (
              <details className="text-small">
                <summary className="cursor-pointer underline underline-offset-2" aria-label={fillMessage(copy.removeLabel, { email: member.email })}>
                  {copy.remove}
                </summary>
                <form action={removeAction} className="mt-2 grid gap-2">
                  <input type="hidden" name="memberId" value={member.id} />
                  <p>{fillMessage(copy.removeQuestion, { email: member.email })}</p>
                  <div>
                    <Button type="submit" variant="destructive" size="touch" className="md:h-7 md:px-2.5">
                      {copy.removeConfirm}
                    </Button>
                  </div>
                </form>
              </details>
            )}
          </li>
        );
      })}
    </ul>
  );
}
