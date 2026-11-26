// A project's Routines tab (CT-10): its routines (the token only as its last four characters), the forms to add one,
// replace a token (each in a dialog), switch it on or off, delete it after a confirmation and Test it, and the fires of
// the last 14 days as one row per issue with a Retry for one issue (CT-15).
import { Badge, List, ListEntry, ListItem } from "@softure-ai/theme-notion";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import { ResultBadge } from "@softure-ai/theme-notion";
import { SectionCard } from "../shell/section-card.tsx";
import { AddRoutineDialog, RoutineEnabledSwitch, RoutineRowMenu } from "./routine-forms.tsx";
import type { PlainFormAction as PlainAction, RoutineFormAction as FormAction } from "./routine-form-state.ts";
import type { RoutineView, RoutinesTab } from "./routines-tab.ts";
import { FiredIssueRow } from "./fired-issue-row.tsx";


export interface RoutineActions {
  readonly add: FormAction;
  readonly replaceToken: FormAction;
  readonly test: FormAction;
  readonly setEnabled: PlainAction;
  readonly remove: PlainAction;
  readonly retry: PlainAction;
}


/** The provider in words; an id the page does not know (a provider removed since) shows as stored. */
function getProviderLabel(provider: string, copy: AppMessages["routines"]): string {
  return Object.hasOwn(copy.providers, provider) ? copy.providers[provider as keyof typeof copy.providers].label : provider;
}

/**
 * The last call as one badge on top of the right column, its result and time together: green on success, red on an
 * error, grey before the first call.
 */
function LastCallBadge({ routine, copy, formatTime }: {
  readonly routine: RoutineView;
  readonly copy: AppMessages["routines"];
  readonly formatTime: (date: Date) => string;
}) {
  if (routine.lastCall === null) {
    return (
      <ResultBadge tone="muted" data-last-call-badge="never">
        {copy.neverCalled}
      </ResultBadge>
    );
  }
  const { ok, status, at } = routine.lastCall;
  const time = formatTime(at);
  return (
    <ResultBadge tone={ok ? "success" : "danger"} title={ok ? copy.lastCallOkLabel : copy.lastCallFailedLabel} data-last-call-badge={ok ? "ok" : "failed"}>
      <span className="sr-only">{`${ok ? copy.lastCallOkLabel : copy.lastCallFailedLabel}: `}</span>
      {status === null ? fillMessage(copy.lastCallError, { time }) : fillMessage(copy.lastCallBadge, { status, time })}
    </ResultBadge>
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
  return (
    // What the routine is on the left; on the right its last call alone on line 1, then its switch and its row menu
    // (the theme's list row, CT-26; each fact once and one inline control, CT-22).
    <ListItem>
      <ListEntry
        title={
          // The kind tag stands beside the name on its line.
          <span className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="min-w-0 break-words">{routine.name}</span>
            <Badge variant="tag" color="gray" data-routine-kind={routine.kind}>
              {Object.hasOwn(copy.kinds, routine.kind) ? copy.kinds[routine.kind as keyof typeof copy.kinds] : routine.kind}
            </Badge>
          </span>
        }
        details={
          <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-small text-muted-foreground">
            <span data-routine-provider={routine.provider}>{getProviderLabel(routine.provider, copy)}</span>
            {routine.target === null ? null : <span className="font-mono break-all">{routine.target}</span>}
            <span className="font-mono" data-token-last4>{fillMessage(copy.tokenShown, { last4: routine.tokenLast4 })}</span>
          </div>
        }
        status={<LastCallBadge routine={routine} copy={copy} formatTime={formatTime} />}
        actions={
          <RoutineEnabledSwitch
            copy={copy}
            repositoryKey={repositoryKey}
            routineId={routine.id}
            name={routine.name}
            enabled={routine.enabled}
            action={actions.setEnabled}
          />
        }
        menu={<RoutineRowMenu copy={copy} repositoryKey={repositoryKey} routine={routine} actions={actions} canStore={canStore} />}
        data-routine={String(routine.id)}
        data-enabled={String(routine.enabled)}
      />
    </ListItem>
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
            <List data-routines density="roomy">
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
            </List>
          )}
        </div>
      </SectionCard>
      <SectionCard id="routine-fires" title={copy.recentTitle} description={copy.recentDescription} count={tab.issues.length}>
        {tab.issues.length === 0 ? (
          <p className="text-small text-muted-foreground">{copy.recentEmpty}</p>
        ) : (
          <List data-fired-issues density="roomy">
            {tab.issues.map((issue) => (
              <FiredIssueRow key={issue.number} issue={issue} messages={messages} name={fullName} retryAction={actions.retry} formatTime={formatTime} />
            ))}
          </List>
        )}
      </SectionCard>
    </>
  );
}
