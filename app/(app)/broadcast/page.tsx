// Broadcast (CV-1): write one word for many projects, and see every broadcast sent so far with how far it got.
import { randomUUID } from "node:crypto";
import { ArrowRight } from "lucide-react";
import { AppLink } from "../../../src/shell/app-link.tsx";
import { fillMessage, getMessages } from "../../../messages/index.ts";
import config from "../../../softure.config.ts";
import { PageLayout } from "../../../src/shell/page-layout.tsx";
import { ROW_SURFACE_CLASS } from "../../../src/shell/row-inset.ts";
import { BroadcastForm } from "../../../src/broadcast/broadcast-form.tsx";
import { loadBroadcasts } from "../../../src/broadcast/load-broadcasts.ts";
import { createTimeFormatter } from "../../../src/projects/format-time.ts";
import { loadWatchedRepositories } from "../../../src/projects/load-repositories.ts";
import { SectionCard } from "../../../src/shell/section-card.tsx";
import { sendBroadcastAction } from "./actions.ts";

export default async function BroadcastPage() {
  const copy = getMessages(config.locale).broadcast;
  const [repositories, broadcasts] = await Promise.all([loadWatchedRepositories(), loadBroadcasts()]);
  const formatTime = createTimeFormatter(config.locale, config.timezone);
  return (
    <PageLayout title={copy.title} description={copy.description}>
      <SectionCard id="broadcast-compose-heading" title={copy.composeHeading} description={copy.composeHint}>
        {repositories.length === 0 ? (
          <p className="text-small text-muted-foreground">{copy.noProjects}</p>
        ) : (
          <BroadcastForm
            copy={copy}
            // A new id per page view: a resubmitted form is the same broadcast, a new page is a new one.
            broadcastId={randomUUID()}
            projects={repositories.map((repository) => ({ key: repository.key, fullName: repository.fullName }))}
            action={sendBroadcastAction}
          />
        )}
      </SectionCard>
      <SectionCard id="broadcast-history-heading" title={copy.historyHeading} count={broadcasts.length} description={copy.doneHint}>
        {broadcasts.length === 0 ? (
          <p className="text-small text-muted-foreground">{copy.historyEmpty}</p>
        ) : (
          <ul aria-label={copy.historyLabel} className="grid divide-y divide-border">
            {broadcasts.map((broadcast) => (
              <li key={broadcast.id}>
                <AppLink
                  href={`/broadcast/${broadcast.id}`}
                  className={`flex min-h-touch-target min-w-0 items-center justify-between gap-3 py-2.5 ${ROW_SURFACE_CLASS}`}
                >
                  <span className="grid min-w-0 gap-1">
                    <span className="truncate font-medium">{broadcast.title}</span>
                    <span className="text-small text-muted-foreground">
                      {fillMessage(copy.summary, {
                        sent: broadcast.counts.sent + broadcast.counts.sending,
                        done: broadcast.counts.done,
                        failed: broadcast.counts.failed,
                      })}
                      {" · "}
                      {fillMessage(copy.sentAt, { time: formatTime(broadcast.createdAt) })}
                    </span>
                  </span>
                  <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                </AppLink>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </PageLayout>
  );
}
