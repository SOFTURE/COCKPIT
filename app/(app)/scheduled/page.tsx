// Scheduled tasks (CT-37): what will be sent when, and what was sent. Built like Broadcast: "Scheduled" (soonest first)
// and "Done" (newest first) are tabs with their counts, the shown tab in the address (`?tab=`), each a list of theme
// rows or the theme's empty state. "New task" in the header and Edit in a row's menu open the task dialog (CT-38), whose
// project picker lists the watched projects in the owner's groups. A repeating task (CT-39) says how it repeats on its
// muted line and shows its next run; each of its runs lands in Done on its own.
import { List } from "@softure-ai/theme-notion";
import { CalendarCheck, CalendarClock } from "lucide-react";
import { connection } from "next/server";
import { fillMessage, getMessages } from "../../../messages/index.ts";
import config from "../../../softure.config.ts";
import { getDatabase } from "../../../src/database.ts";
import { createGroupCollator, groupProjects } from "../../../src/projects/group-projects.ts";
import { loadProjectGroups } from "../../../src/projects/load-project-groups.ts";
import { loadWatchedRepositories } from "../../../src/projects/load-repositories.ts";
import { formatCount } from "../../../src/projects/project-group-copy.ts";
import { createTimeFormatter, createWeekdayTimeFormatter, formatRelativeTime } from "../../../src/projects/format-time.ts";
import { loadScheduledPage } from "../../../src/scheduled/load-scheduled-page.ts";
import { NewScheduledTaskButton } from "../../../src/scheduled/new-scheduled-task-button.tsx";
import { ScheduledRunRow } from "../../../src/scheduled/scheduled-run-row.tsx";
import type { ScheduledDialogContext } from "../../../src/scheduled/scheduled-task-dialog.tsx";
import { getRepeatWord, splitRunAt } from "../../../src/scheduled/scheduled-task-form-state.ts";
import { ScheduledTaskRow } from "../../../src/scheduled/scheduled-task-row.tsx";
import { EmptyState } from "../../../src/shell/empty-page.tsx";
import { PageLayout } from "../../../src/shell/page-layout.tsx";
import { PageTabs, TabPanel } from "../../../src/shell/page-tabs.tsx";
import { pickTab, tabHref } from "../../../src/shell/pick-tab.ts";
import { SectionCard } from "../../../src/shell/section-card.tsx";
import {
  createScheduledTaskAction,
  deleteScheduledTaskAction,
  editScheduledTaskAction,
  runScheduledTaskNowAction,
  setScheduledTaskPauseAction,
} from "./actions.ts";

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
  const [page, repositories, groups, query] = await Promise.all([loadScheduledPage(db), loadWatchedRepositories(), loadProjectGroups(), searchParams]);
  if (!page.ok) {
    throw new Error(`ScheduledPage: reading the scheduled tasks failed (${page.error})`);
  }
  const { scheduled, done } = page.value;
  const now = new Date();
  const formatPlanned = createWeekdayTimeFormatter(config.locale, config.timezone);
  const formatTime = createTimeFormatter(config.locale, config.timezone);
  const countProjects = (count: number) => formatCount(config.locale, copy.projectCount, count);
  const repeatCopy = messages.scheduledRepeat;
  /** "2 projects · weekly · Run the code review on master." */
  const describeRow = (row: (typeof scheduled)[number]) =>
    [countProjects(row.projectCount), getRepeatWord(repeatCopy, row.repeat), row.promptLine].filter((part) => part !== null && part !== "").join(" · ");
  const dialog: ScheduledDialogContext = {
    copy: messages.scheduledDialog,
    repeatCopy,
    // The picker's sections in the owner's groups, as on Broadcast (CT-34); the dialog neither groups nor sorts.
    sections: groupProjects(
      repositories.map((repository) => ({ key: repository.key, fullName: repository.fullName, groupId: repository.groupId })),
      groups,
      { collator: createGroupCollator(config.locale) },
    ),
    timeZone: config.timezone,
    locale: config.locale,
  };
  const current = pickTab(TAB_KEYS, typeof query.tab === "string" ? query.tab : undefined, "scheduled");
  return (
    <PageLayout title={copy.title} description={copy.description} actions={<NewScheduledTaskButton label={copy.newTask} context={dialog} action={createScheduledTaskAction} />}>
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
                    pauseCopy={repeatCopy}
                    row={{
                      id: row.id,
                      title: row.title,
                      details: describeRow(row),
                      time: formatPlanned(row.runAt),
                      relative: formatRelativeTime(config.locale, row.runAt, now),
                      isSending: row.isSending,
                      isPaused: row.isPaused,
                      draft: {
                        id: row.id,
                        title: row.title,
                        prompt: row.prompt,
                        runAt: splitRunAt(row.runAt, config.timezone),
                        repeat: row.repeat,
                        projectKeys: row.repositoryKeys,
                      },
                    }}
                    runNowAction={runScheduledTaskNowAction}
                    pauseAction={setScheduledTaskPauseAction}
                    deleteAction={deleteScheduledTaskAction}
                    editAction={editScheduledTaskAction}
                    dialog={dialog}
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
