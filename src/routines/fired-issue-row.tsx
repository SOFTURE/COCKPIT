// One row of a project's Recent fires card (CT-15), in the theme's list row (CT-18, CT-26): the issue's number and title and the
// time of its fire on the left, its state as a result badge on top of the right column and Retry under it.
import { ListEntry, ListItem } from "@softure-ai/theme-notion";
import { ExternalRowLink } from "../shell/external-row-link.tsx";
import { CircleCheck, CircleDashed, CircleX, Clock, type LucideIcon } from "lucide-react";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import { ResultBadge, type Tone } from "@softure-ai/theme-notion";
import type { FiredIssue, FiredIssueState } from "./routines-tab.ts";
import { describeFire, RetryWakeForm } from "./wake-chip.tsx";

const STATE_LOOKS: Readonly<Record<FiredIssueState, { tone: Tone; icon: LucideIcon }>> = {
  fired: { tone: "success", icon: CircleCheck },
  failed: { tone: "danger", icon: CircleX },
  pending: { tone: "muted", icon: Clock },
  no_routine: { tone: "muted", icon: CircleDashed },
};

/** Every fire of the issue as one line, the routine's name first: the badge's tooltip. */
export function describeIssueFires(copy: AppMessages["wake"], issue: FiredIssue, formatTime: (date: Date) => string): string {
  return issue.wake.fires
    .map((fire) => {
      const line = describeFire(copy, fire, formatTime);
      return fire.status === "no_routine" ? line : fillMessage(copy.fireLine, { routine: fire.routineName ?? copy.removedRoutine, state: line });
    })
    .join("\n");
}

export function FiredIssueRow({ issue, messages, name, retryAction, formatTime }: {
  readonly issue: FiredIssue;
  readonly messages: Pick<AppMessages, "routines" | "wake">;
  /** The project, for the Retry button's accessible name. */
  readonly name: string;
  readonly retryAction: (formData: FormData) => Promise<void>;
  readonly formatTime: (date: Date) => string;
}) {
  const copy = messages.routines;
  const look = STATE_LOOKS[issue.state];
  return (
    <ListItem>
      <ListEntry
        title={fillMessage(copy.issue, { number: issue.number, title: issue.title })}
        href={issue.url}
        linkComponent={ExternalRowLink}
        details={
          <span className="text-small text-muted-foreground" data-fired-at>
            {fillMessage(copy.recentFiredAt, { time: formatTime(issue.firedAt) })}
          </span>
        }
        status={
          <ResultBadge tone={look.tone} icon={look.icon} title={describeIssueFires(messages.wake, issue, formatTime)} data-fired-badge={issue.state}>
            {copy.recentStates[issue.state]}
          </ResultBadge>
        }
        actions={issue.wake.canRetry ? <RetryWakeForm wake={issue.wake} copy={messages.wake} name={name} retryAction={retryAction} /> : null}
        data-fired-issue={String(issue.number)}
        data-fired-state={issue.state}
      />
    </ListItem>
  );
}
