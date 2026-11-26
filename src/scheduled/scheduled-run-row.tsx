// One fired task (CT-37): the title, then "N projects · planned <time>"; on the right one result of the run's sends
// ("Sent 5 of 5", "Failed in 2 of 5", "Sending", or "Not sent" with its reason on hover) and the sent time. The row
// opens its broadcast's detail page, where each project's issue and retries live; a run that made no broadcast
// opens nothing.
import { Badge, ListEntry, ListItem, ResultBadge, type Tone } from "@softure-ai/theme-notion";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import { AppLink } from "../shell/app-link.tsx";
import type { RunResult } from "./build-scheduled-rows.ts";

type Copy = AppMessages["scheduledPage"];

export interface ScheduledRunRowView {
  readonly id: string;
  readonly title: string;
  /** "2 projects · planned Mon, Nov 30, 8:00 AM" */
  readonly details: string;
  /** "sent 30 Nov 2026, 08:00" */
  readonly sentAt: string;
  readonly result: RunResult;
  readonly href: string | null;
}

export interface RunBadge {
  readonly tone: Tone;
  readonly word: string;
  readonly hint: string | undefined;
}

/** The run's badge: its tone and its word; a run that sent nothing carries its reason on hover. */
export function getRunBadge(copy: Copy, failures: AppMessages["scheduled"]["failures"], result: RunResult): RunBadge {
  switch (result.kind) {
    case "sent":
      return { tone: "success", word: fillMessage(copy.sentOf, { sent: result.sent, total: result.total }), hint: undefined };
    case "failed":
      return { tone: "danger", word: fillMessage(copy.failedIn, { failed: result.failed, total: result.total }), hint: undefined };
    case "sending":
      return { tone: "muted", word: copy.sending, hint: undefined };
    case "not_sent": {
      const reason = result.failure === "no_projects" || result.failure === "forge_not_configured" ? failures[result.failure] : failures.other;
      return { tone: "danger", word: copy.notSent, hint: reason };
    }
  }
}

export function ScheduledRunRow({ copy, failures, row }: { readonly copy: Copy; readonly failures: AppMessages["scheduled"]["failures"]; readonly row: ScheduledRunRowView }) {
  const badge = getRunBadge(copy, failures, row.result);
  return (
    <ListItem>
      <ListEntry
        data-scheduled-run={row.id}
        title={<span className="line-clamp-1">{row.title}</span>}
        {...(row.href === null ? {} : { href: row.href, linkComponent: AppLink })}
        details={<span className="line-clamp-1 text-small text-muted-foreground">{row.details}</span>}
        status={
          <>
            <ResultBadge tone={badge.tone} isSpinning={row.result.kind === "sending"} data-run-result={row.result.kind} {...(badge.hint === undefined ? {} : { title: badge.hint })}>
              {badge.word}
            </ResultBadge>
            <Badge variant="tag" color="gray" data-sent-time>
              {row.sentAt}
            </Badge>
          </>
        }
      />
    </ListItem>
  );
}
