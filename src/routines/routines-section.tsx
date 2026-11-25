// A project's Routines tab (CT-10): its routines (the token only as its last four characters), the forms to add one,
// replace a token, enable, disable, delete and Test, and the recent fires by issue with a Retry for one issue.
import { Badge, Button } from "@softure-ai/theme-notion";
import { Power, PowerOff, Trash2 } from "lucide-react";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import { SectionCard } from "../shell/section-card.tsx";
import { AddRoutineForm, ReplaceTokenForm, TestRoutineForm } from "./routine-forms.tsx";
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

const CONTROL_SIZE = "md:h-7 md:px-2.5";

function describeLastCall(routine: RoutineView, copy: AppMessages["routines"], formatTime: (date: Date) => string): string {
  if (routine.lastCall === null) {
    return copy.neverCalled;
  }
  const status = routine.lastCall.status === null ? "—" : String(routine.lastCall.status);
  const template = routine.lastCall.ok ? copy.lastCallOk : copy.lastCallFailed;
  return fillMessage(template, { status, time: formatTime(routine.lastCall.at) });
}

function RoutineRow({ routine, repositoryKey, copy, actions, canStore, formatTime }: {
  readonly routine: RoutineView;
  readonly repositoryKey: string;
  readonly copy: AppMessages["routines"];
  readonly actions: RoutineActions;
  readonly canStore: boolean;
  readonly formatTime: (date: Date) => string;
}) {
  return (
    <li className="grid gap-2 border-b border-border py-3 last:border-b-0" data-routine={routine.id}>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="font-medium break-words">{routine.name}</span>
        <Badge variant="tag" color="gray">{routine.kind}</Badge>
        {routine.enabled ? null : <Badge variant="tag" color="orange">{copy.disabledBadge}</Badge>}
      </div>
      <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-small text-muted-foreground">
        <span className="font-mono break-all">{routine.triggerId}</span>
        <span className="font-mono" data-token-last4>{fillMessage(copy.tokenShown, { last4: routine.tokenLast4 })}</span>
        <span data-last-call>{describeLastCall(routine, copy, formatTime)}</span>
      </div>
      <div className="flex flex-wrap items-start gap-2">
        <TestRoutineForm copy={copy} repositoryKey={repositoryKey} routineId={routine.id} name={routine.name} action={actions.test} disabled={!canStore} />
        <form action={actions.setEnabled}>
          <input type="hidden" name="repositoryKey" value={repositoryKey} />
          <input type="hidden" name="routineId" value={routine.id} />
          <input type="hidden" name="enabled" value={routine.enabled ? "false" : "true"} />
          <Button type="submit" variant="outline" size="touch" className={CONTROL_SIZE}>
            {routine.enabled ? <PowerOff aria-hidden="true" /> : <Power aria-hidden="true" />}
            {routine.enabled ? copy.disable : copy.enable}
          </Button>
        </form>
        <form action={actions.remove}>
          <input type="hidden" name="repositoryKey" value={repositoryKey} />
          <input type="hidden" name="routineId" value={routine.id} />
          <Button type="submit" variant="outline" size="touch" className={CONTROL_SIZE} aria-label={fillMessage(copy.deleteLabel, { name: routine.name })}>
            <Trash2 aria-hidden="true" />
            {copy.delete}
          </Button>
        </form>
      </div>
      <ReplaceTokenForm copy={copy} repositoryKey={repositoryKey} routineId={routine.id} name={routine.name} action={actions.replaceToken} disabled={!canStore} />
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
      <SectionCard id="routines" title={copy.title} description={copy.description} count={tab.routines.length}>
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
          <div className="grid gap-2">
            <h3 className="text-ui font-medium">{copy.addTitle}</h3>
            <AddRoutineForm copy={copy} repositoryKey={repositoryKey} action={actions.add} disabled={!tab.canStore} />
          </div>
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
