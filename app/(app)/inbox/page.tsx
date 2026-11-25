// The inbox (FR-4): every entry waiting for the owner across the watched projects, oldest first, answered in place
// (FR-5), and the answers whose entry has left its project's queue. The entries are grouped into tabs: All and one per
// project with a short code (`?project=owner/name`); inside a project tab the rows drop the project name.
import { List, Status } from "@softure-ai/theme-notion";
import { CircleCheck, FolderGit2, Inbox, Send } from "lucide-react";
import { AppLink } from "../../../src/shell/app-link.tsx";
import { fillMessage, getMessages } from "../../../messages/index.ts";
import config from "../../../softure.config.ts";
import { PageLayout } from "../../../src/shell/page-layout.tsx";
import { getAnswerLabel } from "../../../src/inbox/answer-label.ts";
import { InboxRow } from "../../../src/inbox/inbox-row.tsx";
import { isDeferredRow } from "../../../src/inbox/build-inbox.ts";
import { ALL_TAB_KEY, buildInboxTabs } from "../../../src/inbox/inbox-tabs.ts";
import { loadInbox } from "../../../src/inbox/load-inbox.ts";
import { createTimeFormatter } from "../../../src/projects/format-time.ts";
import { loadScanStatus } from "../../../src/scan/scan-status.ts";
import { InlineMarkdown } from "../../../src/shell/inline-markdown.tsx";
import { SectionCard } from "../../../src/shell/section-card.tsx";
import { EmptyState } from "../../../src/shell/empty-page.tsx";
import { PageTabs } from "../../../src/shell/page-tabs.tsx";
import { retryIssueWakeAction } from "../routines/actions.ts";
import { answerEntryAction } from "./answer/actions.ts";

export default async function InboxPage({ searchParams }: {
  readonly searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}) {
  const messages = getMessages(config.locale);
  const copy = messages.inbox;
  const [inbox, scan, query] = await Promise.all([loadInbox(), loadScanStatus(), searchParams]);
  const formatTime = createTimeFormatter(config.locale, config.timezone);
  const wake = { copy: messages.wake, retryAction: retryIssueWakeAction, formatTime };
  const requested = query.project;
  const tabs = buildInboxTabs({ basePath: "/inbox", requested: typeof requested === "string" ? requested : undefined, rows: inbox.rows });
  const shownProject = tabs.current === ALL_TAB_KEY ? null : tabs.current;
  const isShown = (projectName: string): boolean => shownProject === null || projectName === shownProject;
  const rows = inbox.rows.filter((row) => isShown(row.projectName));
  const waiting = rows.filter((row) => !isDeferredRow(row));
  const deferred = rows.filter(isDeferredRow);
  const history = inbox.history.filter((answer) => isShown(answer.projectName));
  const lastScan = scan.lastSucceededAt === null ? copy.neverScanned : fillMessage(copy.lastScan, { time: formatTime(scan.lastSucceededAt) });
  const waitingDescription =
    shownProject === null ? (
      lastScan
    ) : (
      <>
        <AppLink href={`/projects/${shownProject}`} className="font-medium text-foreground hover:underline">
          {shownProject}
        </AppLink>
        {` · ${lastScan}`}
      </>
    );
  return (
    <PageLayout title={copy.title} description={copy.description}>
      {inbox.rows.length === 0 ? null : (
        <PageTabs
          label={copy.tabsLabel}
          current={tabs.current}
          tabs={tabs.tabs.map((tab) => ({
            key: tab.key,
            label: tab.label ?? copy.allTab,
            href: tab.href,
            icon: tab.projectName === null ? Inbox : FolderGit2,
            count: tab.count,
          }))}
        />
      )}
      {waiting.length === 0 ? (
        <EmptyState icon={Inbox} title={copy.emptyTitle} description={`${copy.emptyDescription} ${lastScan}`} />
      ) : (
        <SectionCard id="waiting-heading" title={copy.waitingTitle} count={waiting.length} description={waitingDescription}>
          <List aria-label={copy.listLabel} density="roomy">
            {waiting.map((row) => (
              <InboxRow key={`${row.projectKey}:${row.entry.id}`} row={row} copy={copy} answerAction={answerEntryAction} showProject={shownProject === null} wake={wake} />
            ))}
          </List>
        </SectionCard>
      )}
      {deferred.length === 0 ? null : (
        <SectionCard id="deferred-heading" title={copy.deferredTitle} count={deferred.length} description={copy.deferredHint}>
          <List aria-label={copy.deferredLabel} density="roomy">
            {deferred.map((row) => (
              <InboxRow key={`${row.projectKey}:${row.entry.id}`} row={row} copy={copy} answerAction={answerEntryAction} showProject={shownProject === null} />
            ))}
          </List>
        </SectionCard>
      )}
      {history.length === 0 ? null : (
        <SectionCard id="answered-earlier" title={copy.historyTitle} description={copy.historyHint}>
          <List aria-label={copy.historyLabel} density="roomy">
            {history.map((answer) => (
              <li key={`${answer.projectName}#${String(answer.issueNumber)}`} className="grid gap-1 py-3">
                <p className="min-w-0 break-words text-muted-foreground">
                  <InlineMarkdown text={answer.entryText} />
                </p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-small">
                  <AppLink href={`/projects/${answer.projectName}`} className="font-medium hover:underline">
                    {answer.projectName}
                  </AppLink>
                  <Status color={answer.done ? "green" : "blue"} icon={answer.done ? CircleCheck : Send}>
                    {answer.done ? copy.done : copy.sent}
                  </Status>
                  <a href={answer.issueUrl} className="underline underline-offset-2" rel="noreferrer" target="_blank">
                    {fillMessage(copy.answerIssue, { answer: getAnswerLabel(copy, answer.entryKind, answer.answer), number: answer.issueNumber })}
                  </a>
                  {answer.answeredBy === null ? null : <span className="text-muted-foreground">{fillMessage(copy.answeredBy, { name: answer.answeredBy })}</span>}
                </div>
              </li>
            ))}
          </List>
        </SectionCard>
      )}
    </PageLayout>
  );
}
