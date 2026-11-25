// One broadcast (CV-1): its message and every project it went to, as sent (issue link), done (issue closed) or failed
// (reason and a retry that never creates a second issue); each issue shows its project's routine fires with a Retry (CT-10).
// Each project is one shared list row (`SendRow`): the send state and its fires on top of the right column, one inline
// control and the row menu under them (CT-23).
import { notFound } from "next/navigation";
import { fillMessage, getMessages } from "../../../../messages/index.ts";
import config from "../../../../softure.config.ts";
import { PageLayout } from "../../../../src/shell/page-layout.tsx";
import { loadBroadcast } from "../../../../src/broadcast/load-broadcasts.ts";
import { retryIssueWakeAction } from "../../routines/actions.ts";
import { SendRow } from "../../../../src/broadcast/send-row.tsx";
import { createTimeFormatter } from "../../../../src/projects/format-time.ts";
import { SectionCard } from "../../../../src/shell/section-card.tsx";
import { retryBroadcastSendAction } from "../actions.ts";

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
            <SendRow
              key={send.key}
              broadcastId={broadcast.id}
              send={send}
              messages={messages}
              actions={{ retryFire: retryIssueWakeAction, retrySend: retryBroadcastSendAction }}
              formatTime={formatTime}
            />
          ))}
        </ul>
      </SectionCard>
    </PageLayout>
  );
}
