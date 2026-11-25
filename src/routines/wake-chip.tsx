// Waking as the screens show it (CT-10): the overview's chip for a project, and the fires of one issue with a Retry.
import { Badge, Button, Status } from "@softure-ai/theme-notion";
import { CircleCheck, CircleDashed, Clock, RotateCw, TriangleAlert } from "lucide-react";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
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

function FireStatus({ fire, copy, formatTime }: { readonly fire: FireView; readonly copy: Copy; readonly formatTime: (date: Date) => string }) {
  const text = describeFire(copy, fire, formatTime);
  const line = fire.status === "no_routine" ? text : fillMessage(copy.fireLine, { routine: fire.routineName ?? copy.removedRoutine, state: text });
  switch (fire.status) {
    case "sent":
      return <Status color="green" icon={CircleCheck}>{line}</Status>;
    case "failed":
      return <Status color="orange" icon={TriangleAlert}>{line}</Status>;
    case "queued":
      return <Status color="blue" icon={Clock}>{line}</Status>;
    case "sending":
    case "no_routine":
      return <Status color="gray" icon={CircleDashed}>{line}</Status>;
  }
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
    <div className="flex min-w-0 flex-wrap items-center gap-2 text-small" data-issue-wake={`${wake.repositoryKey}#${String(wake.issueNumber)}`}>
      {wake.fires.map((fire, index) => (
        <span key={`${fire.routineName ?? "none"}-${String(index)}`} data-fire={fire.status}>
          <FireStatus fire={fire} copy={copy} formatTime={formatTime} />
        </span>
      ))}
      {wake.canRetry ? (
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
      ) : null}
    </div>
  );
}
