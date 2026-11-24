// One broadcast (CV-1): its message and every project it went to, as sent (issue link), done (issue closed) or failed
// (reason and a retry that never creates a second issue); an open issue shows what wakes its project (CV-2).
import { Button } from "@softure-ai/theme-notion";
import { ExternalLink, RotateCw } from "lucide-react";
import { notFound } from "next/navigation";
import { fillMessage, getMessages } from "../../../../messages/index.ts";
import config from "../../../../softure.config.ts";
import { PageLayout } from "../../../../src/shell/page-layout.tsx";
import { loadBroadcast } from "../../../../src/broadcast/load-broadcasts.ts";
import { WakeChip } from "../../../../src/adapters/wake/wake-chip.tsx";
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
  const time = createTimeFormatter(config.locale, config.timezone)(broadcast.createdAt);
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
        <ul aria-label={copy.projectsLabel} className="grid divide-y divide-border border-t border-border">
          {broadcast.sends.map((send) => (
            <li key={send.key} className="flex flex-wrap items-start justify-between gap-3 py-3 last:pb-0">
              <div className="grid min-w-0 flex-1 gap-1">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="truncate font-medium">{send.fullName}</span>
                  <SendStatus state={send.state} copy={copy} />
                  {send.state === "sent" ? <WakeChip wake={send.wake} copy={messages.wake} /> : null}
                </div>
                {send.failure === null ? null : <p className="text-small text-muted-foreground">{copy.failures[send.failure]}</p>}
              </div>
              {send.issueUrl !== null && send.issueNumber !== null ? (
                <Button asChild variant="outline" size="touch" className={CONTROL_SIZE}>
                  <a href={send.issueUrl} rel="noreferrer" target="_blank">
                    <ExternalLink aria-hidden="true" />
                    {fillMessage(copy.issue, { number: send.issueNumber })}
                  </a>
                </Button>
              ) : null}
              {send.state === "failed" || send.state === "sending" ? (
                <form action={retryBroadcastSendAction} className="shrink-0">
                  <input type="hidden" name="broadcastId" value={broadcast.id} />
                  <input type="hidden" name="repository" value={send.key} />
                  <Button type="submit" variant="outline" size="touch" className={CONTROL_SIZE} aria-label={fillMessage(copy.retryLabel, { name: send.fullName })}>
                    <RotateCw aria-hidden="true" />
                    {copy.retry}
                  </Button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      </SectionCard>
    </PageLayout>
  );
}
