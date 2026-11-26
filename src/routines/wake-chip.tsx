// Waking as the screens show it (CT-10): the overview's chip for a project, and the fires of one issue with a Retry.
import { Button } from "@softure-ai/theme-notion";
import { CircleCheck, CircleDashed, CircleX, Clock, RotateCw, type LucideIcon } from "lucide-react";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import { ResultBadge, type Tone } from "@softure-ai/theme-notion";
import type { FireView, IssueWake, ProjectWake } from "./wake-view.ts";

type Copy = AppMessages["wake"];
type RetryWakeTarget = Pick<IssueWake, "repositoryKey" | "issueNumber">;
type FormFields = Readonly<Record<string, string>>;

// Waking as a result (CT-19): wakes on its own success, failing needs attention, untested or none muted.
const CHIP_TONES: Readonly<Record<ProjectWake, Tone>> = { on_its_own: "success", failing: "warning", untested: "muted", none: "muted" };

export function WakeChip({ wake, copy }: { readonly wake: ProjectWake; readonly copy: Copy }) {
  return (
    <ResultBadge tone={CHIP_TONES[wake]} title={copy.hints[wake]} data-wake={wake}>
      {copy.states[wake]}
    </ResultBadge>
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
const FIRE_LOOKS: Readonly<Record<FireView["status"], { tone: Tone; icon: LucideIcon }>> = {
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
    <ResultBadge tone={look.tone} icon={look.icon} title={title} data-fire-state={fire.status}>
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

/** The fields a Retry of one issue's fires sends to its action: the form's hidden inputs, and a row menu's item (CT-23). */
export function getRetryWakeFields(wake: RetryWakeTarget): FormFields {
  return { repositoryKey: wake.repositoryKey, issueNumber: String(wake.issueNumber) };
}

/** Retry for one issue: fires again what did not go through (failed, queued or no-routine fires). */
export function RetryWakeForm({
  wake,
  copy,
  name,
  retryAction,
}: {
  readonly wake: RetryWakeTarget;
  readonly copy: Copy;
  /** The project, for the button's accessible name. */
  readonly name: string;
  readonly retryAction: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={retryAction} className="shrink-0">
      {Object.entries(getRetryWakeFields(wake)).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
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
