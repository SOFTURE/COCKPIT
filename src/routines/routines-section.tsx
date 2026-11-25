// A project's Routines tab (CT-10): its routines (the token only as its last four characters), the forms to add one,
// replace a token (each in a dialog), switch it on or off, delete it after a confirmation and Test it, and the recent fires by issue with a Retry for one issue.
import { Badge, Status } from "@softure-ai/theme-notion";
import { CircleCheck, CirclePause } from "lucide-react";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import { ConfirmDeleteButton } from "../shell/confirm-delete-button.tsx";
import { SectionCard } from "../shell/section-card.tsx";
import { AddRoutineDialog, ReplaceTokenDialog, RoutineEnabledSwitch, TestRoutineForm } from "./routine-forms.tsx";
import type { PlainFormAction as PlainAction, RoutineFormAction as FormAction } from "./routine-form-state.ts";
import type { RoutineView, RoutinesTab } from "./routines-tab.ts";
import { IssueWakeStatus } from "./wake-chip.tsx";


export interface RoutineActions {
  readonly add: FormAction;
  readonly replaceToken: FormAction;
  readonly test: FormAction;
  readonly setEnabled: PlainAction;
  readonly remove: PlainAction;
  readonly retry: PlainAction;
}


function describeLastCall(routine: RoutineView, copy: AppMessages["routines"], formatTime: (date: Date) => string): string {
  return routine.lastCall === null ? copy.neverCalled : fillMessage(copy.lastCallAt, { time: formatTime(routine.lastCall.at) });
}

/** The last call's result as a badge beside the routine's kind: green on success, red on an error. */
function LastCallBadge({ routine, copy }: { readonly routine: RoutineView; readonly copy: AppMessages["routines"] }) {
  if (routine.lastCall === null) {
    return null;
  }
  const { ok, status } = routine.lastCall;
  return (
    <Badge variant="tag" color={ok ? "green" : "red"} title={ok ? copy.lastCallOkLabel : copy.lastCallFailedLabel} data-last-call-badge={ok ? "ok" : "failed"}>
      <span className="sr-only">{`${ok ? copy.lastCallOkLabel : copy.lastCallFailedLabel}: `}</span>
      {status === null ? copy.lastCallError : fillMessage(copy.lastCallBadge, { status })}
    </Badge>
  );
}

function RoutineRow({ routine, repositoryKey, copy, actions, canStore, formatTime }: {
  readonly routine: RoutineView;
  readonly repositoryKey: string;
  readonly copy: AppMessages["routines"];
  readonly actions: RoutineActions;
  readonly canStore: boolean;
  readonly formatTime: (date: Date) => string;
}) {
  const stateText = routine.enabled ? copy.enabled : copy.disabledBadge;
  return (
    // What the routine is on the left, its controls on the right (under it on a phone).
    <li className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-b border-border py-3 last:border-b-0" data-routine={routine.id} data-enabled={routine.enabled}>
      <div className="grid min-w-0 flex-1 basis-64 gap-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span title={stateText} data-routine-state>
            <Status color={routine.enabled ? "green" : "orange"} icon={routine.enabled ? CircleCheck : CirclePause}>
              <span className="sr-only">{stateText}</span>
            </Status>
          </span>
          <span className="font-medium break-words">{routine.name}</span>
          <Badge variant="tag" color="gray" data-routine-kind={routine.kind}>
            {Object.hasOwn(copy.kinds, routine.kind) ? copy.kinds[routine.kind as keyof typeof copy.kinds] : routine.kind}
          </Badge>
          <LastCallBadge routine={routine} copy={copy} />
        </div>
        <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-small text-muted-foreground">
          <span className="font-mono break-all">{routine.triggerId}</span>
          <span className="font-mono" data-token-last4>{fillMessage(copy.tokenShown, { last4: routine.tokenLast4 })}</span>
          <span data-last-call>{describeLastCall(routine, copy, formatTime)}</span>
        </div>
      </div>
      <div className="flex flex-wrap items-start justify-end gap-2">
        <RoutineEnabledSwitch copy={copy} repositoryKey={repositoryKey} routineId={routine.id} name={routine.name} enabled={routine.enabled} action={actions.setEnabled} />
        <TestRoutineForm copy={copy} repositoryKey={repositoryKey} routineId={routine.id} name={routine.name} action={actions.test} disabled={!canStore} />
        <ReplaceTokenDialog copy={copy} repositoryKey={repositoryKey} routineId={routine.id} name={routine.name} action={actions.replaceToken} disabled={!canStore} />
        <ConfirmDeleteButton
          copy={{
            label: fillMessage(copy.deleteLabel, { name: routine.name }),
            question: fillMessage(copy.deleteQuestion, { name: routine.name }),
            hint: copy.deleteHint,
            delete: copy.delete,
            deleting: copy.deleting,
            cancel: copy.cancel,
          }}
          fields={{ repositoryKey, routineId: String(routine.id) }}
          action={actions.remove}
        />
      </div>
    </li>
  );
}

export function RoutinesSection({ tab, repositoryKey, fullName, messages, actions, formatTime }: {
  readonly tab: RoutinesTab;
  readonly repositoryKey: string;
  readonly fullName: string;
  readonly messages: Pick<AppMessages, "routines" | "wake">;
  readonly actions: RoutineActions;
  readonly formatTime: (date: Date) => string;
}) {
  const copy = messages.routines;
  return (
    <>
      <SectionCard
        id="routines"
        title={copy.title}
        description={copy.description}
        count={tab.routines.length}
        action={<AddRoutineDialog copy={copy} repositoryKey={repositoryKey} action={actions.add} disabled={!tab.canStore} />}
      >
        <div className="grid gap-4">
          {tab.canStore ? null : (
            <p role="note" className="text-small text-orange" data-secret-missing>
              {copy.secretMissing}
            </p>
          )}
          {tab.routines.length === 0 ? (
            <p className="text-small text-muted-foreground">{copy.empty}</p>
          ) : (
            <ul className="grid" data-routines>
              {tab.routines.map((routine) => (
                <RoutineRow
                  key={routine.id}
                  routine={routine}
                  repositoryKey={repositoryKey}
                  copy={copy}
                  actions={actions}
                  canStore={tab.canStore}
                  formatTime={formatTime}
                />
              ))}
            </ul>
          )}
        </div>
      </SectionCard>
      <SectionCard id="routine-fires" title={copy.recentTitle} description={copy.recentDescription} count={tab.issues.length}>
        {tab.issues.length === 0 ? (
          <p className="text-small text-muted-foreground">{copy.recentEmpty}</p>
        ) : (
          <ul className="grid gap-3" data-fired-issues>
            {tab.issues.map((issue) => (
              <li key={issue.number} className="grid gap-1">
                <a href={issue.url} className="min-w-0 break-words text-ui underline-offset-2 hover:underline">
                  {fillMessage(copy.issue, { number: issue.number, title: issue.title })}
                </a>
                <IssueWakeStatus wake={issue.wake} copy={messages.wake} name={fullName} retryAction={actions.retry} formatTime={formatTime} />
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </>
  );
}
