// Broadcast (CV-1): write one word for many projects, see every broadcast sent so far with how far it got, and delete
// one from the list. "New" and "Sent" are tabs (CT-21; the shown tab lives in the address, `?tab=`).
import { List, ListEntry, ListItem } from "@softure-ai/theme-notion";
import { AppLink } from "../../../src/shell/app-link.tsx";
import { randomUUID } from "node:crypto";
import { Megaphone, Send } from "lucide-react";
import { fillMessage, getMessages } from "../../../messages/index.ts";
import config from "../../../softure.config.ts";
import { PageLayout } from "../../../src/shell/page-layout.tsx";
import { BroadcastForm } from "../../../src/broadcast/broadcast-form.tsx";
import { DeleteBroadcastButton } from "../../../src/broadcast/delete-broadcast-button.tsx";
import { loadBroadcasts } from "../../../src/broadcast/load-broadcasts.ts";
import { createTimeFormatter } from "../../../src/projects/format-time.ts";
import { createGroupCollator, groupProjects } from "../../../src/projects/group-projects.ts";
import { loadProjectGroups } from "../../../src/projects/load-project-groups.ts";
import { loadWatchedRepositories } from "../../../src/projects/load-repositories.ts";
import { PageTabs, TabPanel } from "../../../src/shell/page-tabs.tsx";
import { pickTab, tabHref } from "../../../src/shell/pick-tab.ts";
import { SectionCard } from "../../../src/shell/section-card.tsx";
import { deleteBroadcastAction, sendBroadcastAction } from "./actions.ts";

const TAB_KEYS = ["new", "sent"] as const;

export default async function BroadcastPage({ searchParams }: {
  readonly searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}) {
  const copy = getMessages(config.locale).broadcast;
  const [repositories, groups, broadcasts, query] = await Promise.all([loadWatchedRepositories(), loadProjectGroups(), loadBroadcasts(), searchParams]);
  const formatTime = createTimeFormatter(config.locale, config.timezone);
  const current = pickTab(TAB_KEYS, typeof query.tab === "string" ? query.tab : undefined, "new");
  return (
    <PageLayout title={copy.title} description={copy.description}>
      <PageTabs
        label={copy.tabsLabel}
        current={current}
        tabs={[
          { key: "new", label: copy.tabs.new, href: tabHref("/broadcast", "new"), icon: Megaphone },
          { key: "sent", label: copy.tabs.sent, href: tabHref("/broadcast", "sent"), icon: Send, count: broadcasts.length },
        ]}
      />
      <TabPanel current={current}>
        {current === "new" ? (
          <SectionCard id="broadcast-compose-heading" title={copy.composeHeading} description={copy.composeHint}>
            {repositories.length === 0 ? (
              <p className="text-small text-muted-foreground">{copy.noProjects}</p>
        ) : (
              <BroadcastForm
                copy={copy}
                // A new id per page view: a resubmitted form is the same broadcast, a new page is a new one.
                broadcastId={randomUUID()}
                // The picker's sections in the owner's groups (CT-34); the form neither groups nor sorts.
                sections={groupProjects(
                  repositories.map((repository) => ({ key: repository.key, fullName: repository.fullName, groupId: repository.groupId })),
                  groups,
                  { collator: createGroupCollator(config.locale) },
                )}
                action={sendBroadcastAction}
              />
        )}
          </SectionCard>
        ) : (
          <SectionCard id="broadcast-history-heading" title={copy.historyHeading} count={broadcasts.length} description={copy.doneHint}>
            {broadcasts.length === 0 ? (
              <p className="text-small text-muted-foreground">{copy.historyEmpty}</p>
        ) : (
              <List aria-label={copy.historyLabel} density="roomy">
                {broadcasts.map((broadcast) => (
                  // One box: the title's link opens the broadcast from anywhere on the row, which lights on hover; the
                  // trash can sits in the row's right column, the theme's arrow after it (CT-26).
                  <ListItem key={broadcast.id}>
                    <ListEntry
                      title={broadcast.title}
                      href={`/broadcast/${broadcast.id}`}
                      linkComponent={AppLink}
                      details={
                        <span className="text-small text-muted-foreground">
                          {fillMessage(copy.summary, {
                            sent: broadcast.counts.sent + broadcast.counts.sending,
                            done: broadcast.counts.done,
                            failed: broadcast.counts.failed,
                          })}
                          {" · "}
                          {fillMessage(copy.sentAt, { time: formatTime(broadcast.createdAt) })}
                        </span>
                      }
                      actions={<DeleteBroadcastButton copy={copy} broadcastId={broadcast.id} title={broadcast.title} action={deleteBroadcastAction} />}
                    />
                  </ListItem>
                ))}
              </List>
        )}
          </SectionCard>
        )}
      </TabPanel>
    </PageLayout>
  );
}
