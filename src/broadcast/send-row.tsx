// One project of a broadcast (CT-18, CT-23): the send state and its fires on top of the right column; under them at
// most one inline control (Retry send when the send failed or is stuck, otherwise the Issue link) and the row menu with
// the rest (`pickSendControls`). The inline control is a plain link or form, so it works before the page's script runs.
import { Button } from "@softure-ai/theme-notion";
import { ExternalLink, RotateCw } from "lucide-react";
import type { ReactNode } from "react";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import { getRetryWakeFields, IssueFireBadges, RetryWakeForm } from "../routines/wake-chip.tsx";
import { ListRow } from "../shell/list-row.tsx";
import type { SendView } from "./build-broadcast-view.ts";
import { pickSendControls, type SendControl } from "./send-controls.ts";
import { SendRowMenu, type SendMenuItem } from "./send-row-menu.tsx";
import { SendStatus } from "./send-status.tsx";

// 44 px on a phone, the theme's 28 px control from md up (as on Settings).
const CONTROL_SIZE = "md:h-7 md:px-2.5";

export interface SendRowActions {
  readonly retryFire: (formData: FormData) => Promise<void>;
  readonly retrySend: (formData: FormData) => Promise<void>;
}

export interface SendRowProps {
  readonly broadcastId: string;
  readonly send: SendView;
  readonly messages: AppMessages;
  readonly actions: SendRowActions;
  readonly formatTime: (date: Date) => string;
}

function getRetrySendFields(broadcastId: string, send: SendView): Readonly<Record<string, string>> {
  return { broadcastId, repository: send.key };
}

function InlineControl({ control, broadcastId, send, messages, actions }: Omit<SendRowProps, "formatTime"> & { readonly control: SendControl }): ReactNode {
  const copy = messages.broadcast;
  switch (control) {
    case "issue":
      return send.issueUrl === null || send.issueNumber === null ? null : (
        <Button asChild variant="outline" size="touch" className={CONTROL_SIZE}>
          <a href={send.issueUrl} rel="noreferrer" target="_blank">
            <ExternalLink aria-hidden="true" />
            {fillMessage(copy.issue, { number: send.issueNumber })}
          </a>
        </Button>
      );
    case "retry-fire":
      return send.wake === null ? null : <RetryWakeForm wake={send.wake} copy={messages.wake} name={send.fullName} retryAction={actions.retryFire} />;
    case "retry-send":
      return (
        <form action={actions.retrySend} className="shrink-0">
          {Object.entries(getRetrySendFields(broadcastId, send)).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <Button type="submit" variant="outline" size="touch" className={CONTROL_SIZE} aria-label={fillMessage(copy.retryLabel, { name: send.fullName })}>
            <RotateCw aria-hidden="true" />
            {copy.retry}
          </Button>
        </form>
      );
  }
}

function toMenuItem(control: SendControl, broadcastId: string, send: SendView): SendMenuItem | null {
  switch (control) {
    case "issue":
      return send.issueUrl === null || send.issueNumber === null ? null : { kind: "issue", url: send.issueUrl, number: send.issueNumber };
    case "retry-fire":
      return send.wake === null ? null : { kind: "retry-fire", fields: getRetryWakeFields(send.wake) };
    case "retry-send":
      return { kind: "retry-send", fields: getRetrySendFields(broadcastId, send) };
  }
}

export function SendRow({ broadcastId, send, messages, actions, formatTime }: SendRowProps) {
  const copy = messages.broadcast;
  const controls = pickSendControls({
    hasIssue: send.issueUrl !== null && send.issueNumber !== null,
    canRetryFire: send.wake !== null && send.wake.canRetry,
    canRetrySend: send.state === "failed" || send.state === "sending",
  });
  const menuItems = controls.menu.flatMap((control) => toMenuItem(control, broadcastId, send) ?? []);
  return (
    <ListRow
      title={send.fullName}
      data={{ "data-send-row": send.key }}
      details={
        <>
          {send.failure === null ? null : <p className="text-small text-muted-foreground">{copy.failures[send.failure]}</p>}
          {send.failedAt === null ? null : (
            <p className="text-small text-muted-foreground">
              {[
                ...(send.failureToken === null ? [] : [fillMessage(copy.refusedToken, { token: send.failureToken })]),
                fillMessage(copy.lastTried, { time: formatTime(send.failedAt) }),
              ].join(" · ")}
            </p>
          )}
        </>
      }
      status={
        <span className="contents" data-send-line>
          <SendStatus state={send.state} copy={copy} />
          {send.wake === null ? null : <IssueFireBadges wake={send.wake} copy={messages.wake} formatTime={formatTime} />}
        </span>
      }
      actions={
        controls.inline === null ? null : (
          <>
            <InlineControl control={controls.inline} broadcastId={broadcastId} send={send} messages={messages} actions={actions} />
            {menuItems.length === 0 ? null : (
              <SendRowMenu
                copy={{ moreActionsLabel: copy.moreActionsLabel, openIssue: copy.openIssue, retryFire: copy.retryFire, retrySend: copy.retrySend }}
                name={send.fullName}
                items={menuItems}
                retryFireAction={actions.retryFire}
                retrySendAction={actions.retrySend}
              />
            )}
          </>
        )
      }
    />
  );
}
