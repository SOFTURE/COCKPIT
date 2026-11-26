// Scheduled tasks (CT-37): what will be sent when, and what was sent. Built like Broadcast: "Scheduled" (soonest first)
// and "Done" (newest first) are tabs with their counts, the shown tab in the address (`?tab=`), each a list of theme
// rows or the theme's empty state. The header's "New task" slot is CT-38's.
import { List } from "@softure-ai/theme-notion";
import { CalendarCheck, CalendarClock } from "lucide-react";
import { connection } from "next/server";
import { fillMessage, getMessages } from "../../../messages/index.ts";
import config from "../../../softure.config.ts";
import { getDatabase } from "../../../src/database.ts";
import { formatCount } from "../../../src/projects/project-group-copy.ts";
import { createTimeFormatter, createWeekdayTimeFormatter, formatRelativeTime } from "../../../src/projects/format-time.ts";
import { loadScheduledPage } from "../../../src/scheduled/load-scheduled-page.ts";
import { ScheduledRunRow } from "../../../src/scheduled/scheduled-run-row.tsx";
import { ScheduledTaskRow } from "../../../src/scheduled/scheduled-task-row.tsx";
import { EmptyState } from "../../../src/shell/empty-page.tsx";
import { PageLayout } from "../../../src/shell/page-layout.tsx";
import { PageTabs, TabPanel } from "../../../src/shell/page-tabs.tsx";
import { pickTab, tabHref } from "../../../src/shell/pick-tab.ts";
import { SectionCard } from "../../../src/shell/section-card.tsx";
import { deleteScheduledTaskAction, runScheduledTaskNowAction } from "./actions.ts";

const TAB_KEYS = ["scheduled", "done"] as const;
const PATH = "/scheduled";

export default async function ScheduledPage({ searchParams }: {
  readonly searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}) {
  // Request-time data: never read while the build prerenders.
  await connection();
  const messages = getMessages(config.locale);
  const copy = messages.scheduledPage;
  const { db } = await getDatabase();
  const [page, query] = await Promise.all([loadScheduledPage(db), searchParams]);
  if (!page.ok) {
    throw new Error(`ScheduledPage: reading the scheduled tasks failed (${page.error})`);
  }
  const { scheduled, done } = page.value;
  const now = new Date();
  const formatPlanned = createWeekdayTimeFormatter(config.locale, config.timezone);
  const formatTime = createTimeFormatter(config.locale, config.timezone);
  const countProjects = (count: number) => formatCount(config.locale, copy.projectCount, count);
  const current = pickTab(TAB_KEYS, typeof query.tab === "string" ? query.tab : undefined, "scheduled");
  return (
    <PageLayout title={copy.title} description={copy.description}>
      <PageTabs
        label={copy.tabsLabel}
        current={current}
        tabs={[
          { key: "scheduled", label: copy.tabs.scheduled, href: tabHref(PATH, "scheduled"), icon: CalendarClock, count: scheduled.length },
          { key: "done", label: copy.tabs.done, href: tabHref(PATH, "done"), icon: CalendarCheck, count: done.length },
        ]}
      />
      <TabPanel current={current}>
        {current === "scheduled" ? (
          <SectionCard id="scheduled-tasks-heading" title={copy.scheduledHeading} count={scheduled.length} description={copy.scheduledHint}>
            {scheduled.length === 0 ? (
              <EmptyState icon={CalendarClock} title={copy.scheduledEmptyTitle} description={copy.scheduledEmpty} />
            ) : (
              <List aria-label={copy.scheduledLabel} density="roomy">
                {scheduled.map((row) => (
                  <ScheduledTaskRow
                    key={row.id}
                    copy={copy}
                    row={{
                      id: row.id,
                      title: row.title,
                      details: row.promptLine === "" ? countProjects(row.projectCount) : `${countProjects(row.projectCount)} · ${row.promptLine}`,
                      time: formatPlanned(row.runAt),
                      relative: formatRelativeTime(config.locale, row.runAt, now),
                      isSending: row.isSending,
                    }}
                    runNowAction={runScheduledTaskNowAction}
                    deleteAction={deleteScheduledTaskAction}
                  />
                ))}
              </List>
            )}
          </SectionCard>
        ) : (
          <SectionCard id="scheduled-done-heading" title={copy.doneHeading} count={done.length} description={copy.doneHint}>
            {done.length === 0 ? (
              <EmptyState icon={CalendarCheck} title={copy.doneEmptyTitle} description={copy.doneEmpty} />
            ) : (
              <List aria-label={copy.doneLabel} density="roomy">
                {done.map((row) => (
                  <ScheduledRunRow
                    key={row.id}
                    copy={copy}
                    failures={messages.scheduled.failures}
                    row={{
                      id: row.id,
                      title: row.title,
                      details: `${countProjects(row.projectCount)} · ${fillMessage(copy.planned, { time: formatPlanned(row.runAt) })}`,
                      sentAt: fillMessage(copy.sentAt, { time: formatTime(row.sentAt) }),
                      result: row.result,
                      href: row.href,
                    }}
                  />
                ))}
              </List>
            )}
          </SectionCard>
        )}
      </TabPanel>
    </PageLayout>
  );
}
