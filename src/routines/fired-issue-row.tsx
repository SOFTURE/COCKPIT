// One row of a project's Recent fires card (CT-15): the issue's number and title and the time of its fire on the left,
// its state as a badge on top of the right column and Retry under it, in the shared row inset of `row-inset.ts`.
import { Badge } from "@softure-ai/theme-notion";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import type { FiredIssue, FiredIssueState } from "./routines-tab.ts";
import { describeFire, RetryWakeForm } from "./wake-chip.tsx";

const STATE_COLORS = { fired: "green", failed: "red", pending: "blue", no_routine: "gray" } as const satisfies Record<FiredIssueState, string>;

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
  return (
    <li
      className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 rounded-md border-b border-border px-2 py-2 transition-colors last:border-b-0 hover:bg-accent"
      data-fired-issue={issue.number}
      data-fired-state={issue.state}
    >
      <div className="grid min-w-0 gap-0.5">
        <a href={issue.url} className="min-w-0 break-words text-ui underline-offset-2 hover:underline">
          {fillMessage(copy.issue, { number: issue.number, title: issue.title })}
        </a>
        <span className="text-small text-muted-foreground" data-fired-at>
          {fillMessage(copy.recentFiredAt, { time: formatTime(issue.firedAt) })}
        </span>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="flex h-6 items-center whitespace-nowrap">
          <Badge variant="tag" color={STATE_COLORS[issue.state]} title={describeIssueFires(messages.wake, issue, formatTime)} data-fired-badge={issue.state}>
            {copy.recentStates[issue.state]}
          </Badge>
        </span>
        {issue.wake.canRetry ? <RetryWakeForm wake={issue.wake} copy={messages.wake} name={name} retryAction={retryAction} /> : null}
      </div>
    </li>
  );
}
