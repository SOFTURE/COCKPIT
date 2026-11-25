// One broadcast (CV-1): its message and every project it went to, as sent (issue link), done (issue closed) or failed
// (reason and a retry that never creates a second issue); each issue shows its project's routine fires with a Retry (CT-10).
// Each project is one shared list row (CT-18): the send state and its fires on top of the right column, the Issue link
// and the retries under them.
import { Button } from "@softure-ai/theme-notion";
import { ExternalLink, RotateCw } from "lucide-react";
import { notFound } from "next/navigation";
import { fillMessage, getMessages } from "../../../../messages/index.ts";
import config from "../../../../softure.config.ts";
import { PageLayout } from "../../../../src/shell/page-layout.tsx";
import { loadBroadcast } from "../../../../src/broadcast/load-broadcasts.ts";
import { IssueFireBadges, RetryWakeForm } from "../../../../src/routines/wake-chip.tsx";
import { ListRow } from "../../../../src/shell/list-row.tsx";
import { retryIssueWakeAction } from "../../routines/actions.ts";
import { SendStatus } from "../../../../src/broadcast/send-status.tsx";
import { createTimeFormatter } from "../../../../src/projects/format-time.ts";
import { SectionCard } from "../../../../src/shell/section-card.tsx";
import { retryBroadcastSendAction } from "../actions.ts";

// 44 px on a phone, the theme's 28 px control from md up (as on Settings).
const CONTROL_SIZE = "md:h-7 md:px-2.5";

export default async function BroadcastDetailPage({ params }: { readonly params: Promise<{ id: string }> }) {
  const { id } = await params;
  const broadcast = await loadBroadcast(id);
  if (broadcast === null) {
    notFound();
  }
  const messages = getMessages(config.locale);
  const copy = messages.broadcast;
  const formatTime = createTimeFormatter(config.locale, config.timezone);
  const time = formatTime(broadcast.createdAt);
  return (
    <PageLayout
      title={broadcast.title}
      crumbsLabel={copy.crumbsLabel}
      crumbs={[{ label: copy.back, href: "/broadcast" }, { label: broadcast.title }]}
      description={broadcast.sentByName === null ? fillMessage(copy.sentAt, { time }) : fillMessage(copy.sentAtBy, { time, name: broadcast.sentByName })}
    >
      <SectionCard id="broadcast-message-heading" title={copy.bodyLabel}>
        <p className="whitespace-pre-wrap break-words text-ui">{broadcast.body}</p>
      </SectionCard>
      <SectionCard
        id="broadcast-projects-heading"
        title={copy.projectsLegend}
        count={broadcast.sends.length}
        description={`${fillMessage(copy.summary, {
          sent: broadcast.counts.sent + broadcast.counts.sending,
          done: broadcast.counts.done,
          failed: broadcast.counts.failed,
        })}. ${copy.doneHint}`}
      >
        <ul aria-label={copy.projectsLabel} className="grid divide-y divide-border">
          {broadcast.sends.map((send) => (
            <ListRow
              key={send.key}
              title={send.fullName}
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
              actions={[
                send.issueUrl !== null && send.issueNumber !== null ? (
                  <Button key="issue" asChild variant="outline" size="touch" className={CONTROL_SIZE}>
                    <a href={send.issueUrl} rel="noreferrer" target="_blank">
                      <ExternalLink aria-hidden="true" />
                      {fillMessage(copy.issue, { number: send.issueNumber })}
                    </a>
                  </Button>
                ) : null,
                send.wake !== null && send.wake.canRetry ? (
                  <RetryWakeForm key="wake" wake={send.wake} copy={messages.wake} name={send.fullName} retryAction={retryIssueWakeAction} />
                ) : null,
                send.state === "failed" || send.state === "sending" ? (
                  <form key="send" action={retryBroadcastSendAction} className="shrink-0">
                    <input type="hidden" name="broadcastId" value={broadcast.id} />
                    <input type="hidden" name="repository" value={send.key} />
                    <Button type="submit" variant="outline" size="touch" className={CONTROL_SIZE} aria-label={fillMessage(copy.retryLabel, { name: send.fullName })}>
                      <RotateCw aria-hidden="true" />
                      {copy.retry}
                    </Button>
                  </form>
                ) : null,
              ]}
            />
          ))}
        </ul>
      </SectionCard>
    </PageLayout>
  );
}
