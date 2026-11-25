// Waking as the screens show it (CT-10): the overview's chip for a project, and the fires of one issue with a Retry.
import { Badge, Button } from "@softure-ai/theme-notion";
import { CircleCheck, CircleDashed, CircleX, Clock, RotateCw, type LucideIcon } from "lucide-react";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import { ResultBadge, type ResultTone } from "../shell/result-badge.tsx";
import type { FireView, IssueWake, ProjectWake } from "./wake-view.ts";

type Copy = AppMessages["wake"];

const CHIP_COLORS = { on_its_own: "green", failing: "orange", untested: "gray", none: "gray" } as const;

export function WakeChip({ wake, copy }: { readonly wake: ProjectWake; readonly copy: Copy }) {
  return (
    <Badge variant="tag" color={CHIP_COLORS[wake]} title={copy.hints[wake]} className="max-w-full truncate" data-wake={wake}>
      {copy.states[wake]}
    </Badge>
  );
}

function getReasonText(copy: Copy, reason: string | null): string {
  if (reason === null) {
    return copy.reasons.other;
  }
  return reason in copy.reasons ? copy.reasons[reason as keyof Copy["reasons"]] : copy.reasons.other;
}

/** One fire as words: the state, then the HTTP status and the reason when it did not go through. */
export function describeFire(copy: Copy, fire: FireView, formatTime: (date: Date) => string): string {
  const parts: string[] = [copy.fireStates[fire.status]];
  if (fire.httpStatus !== null && fire.status !== "sent") {
    parts.push(fillMessage(copy.httpStatus, { status: fire.httpStatus }));
  }
  if (fire.status === "failed" || fire.status === "queued") {
    parts.push(getReasonText(copy, fire.reason));
  }
  if (fire.status === "queued" && fire.nextAttemptAt !== null) {
    parts.push(fillMessage(copy.nextTry, { time: formatTime(fire.nextAttemptAt) }));
  }
  return parts.join(" · ");
}

// A fire as a result (CT-18): fired green, failed red, queued, sending and no routine grey (pending or none).
const FIRE_LOOKS: Readonly<Record<FireView["status"], { tone: ResultTone; icon: LucideIcon }>> = {
  sent: { tone: "success", icon: CircleCheck },
  failed: { tone: "danger", icon: CircleX },
  queued: { tone: "muted", icon: Clock },
  sending: { tone: "muted", icon: CircleDashed },
  no_routine: { tone: "muted", icon: CircleDashed },
};

function FireStatus({ fire, copy, formatTime }: { readonly fire: FireView; readonly copy: Copy; readonly formatTime: (date: Date) => string }) {
  // Only the state shows; the routine's name is in the tooltip (CT-13).
  const line = describeFire(copy, fire, formatTime);
  const title = fire.status === "no_routine" ? line : fillMessage(copy.fireLine, { routine: fire.routineName ?? copy.removedRoutine, state: line });
  const look = FIRE_LOOKS[fire.status];
  return (
    <ResultBadge tone={look.tone} icon={look.icon} title={title}>
      {line}
    </ResultBadge>
  );
}

/** The fires of one issue as badges, for a row's state slot. */
export function IssueFireBadges({ wake, copy, formatTime }: {
  readonly wake: IssueWake;
  readonly copy: Copy;
  readonly formatTime: (date: Date) => string;
}) {
  return (
    <span className="contents" data-issue-wake={`${wake.repositoryKey}#${String(wake.issueNumber)}`}>
      {wake.fires.map((fire, index) => (
        <span key={`${fire.routineName ?? "none"}-${String(index)}`} className="inline-flex min-w-0" data-fire={fire.status}>
          <FireStatus fire={fire} copy={copy} formatTime={formatTime} />
        </span>
      ))}
    </span>
  );
}

/** The fires of one issue, and a Retry for that issue when something did not go through. */
export function IssueWakeStatus({
  wake,
  copy,
  name,
  retryAction,
  formatTime,
}: {
  readonly wake: IssueWake | null | undefined;
  readonly copy: Copy;
  /** The project, for the Retry button's accessible name. */
  readonly name: string;
  readonly retryAction: (formData: FormData) => Promise<void>;
  readonly formatTime: (date: Date) => string;
}) {
  if (wake === null || wake === undefined) {
    return null;
  }
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2 text-small">
      <IssueFireBadges wake={wake} copy={copy} formatTime={formatTime} />
      {wake.canRetry ? <RetryWakeForm wake={wake} copy={copy} name={name} retryAction={retryAction} /> : null}
    </div>
  );
}

/** Retry for one issue: fires again what did not go through (failed, queued or no-routine fires). */
export function RetryWakeForm({
  wake,
  copy,
  name,
  retryAction,
}: {
  readonly wake: Pick<IssueWake, "repositoryKey" | "issueNumber">;
  readonly copy: Copy;
  /** The project, for the button's accessible name. */
  readonly name: string;
  readonly retryAction: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={retryAction} className="shrink-0">
      <input type="hidden" name="repositoryKey" value={wake.repositoryKey} />
      <input type="hidden" name="issueNumber" value={wake.issueNumber} />
      <Button
        type="submit"
        variant="outline"
        size="touch"
        className="md:h-7 md:px-2.5"
        aria-label={fillMessage(copy.retryLabel, { name, number: wake.issueNumber })}
      >
        <RotateCw aria-hidden="true" />
        {copy.retry}
      </Button>
    </form>
  );
}
