// The inbox (FR-4): every entry waiting for the owner across the watched projects, oldest first, answered in place
// (FR-5), and the answers whose entry has left its project's queue.
import { List, Status } from "@softure-ai/theme-notion";
import { CircleCheck, Inbox, Send } from "lucide-react";
import Link from "next/link";
import { fillMessage, getMessages } from "../../../messages/index.ts";
import config from "../../../softure.config.ts";
import { PageLayout } from "../../../src/shell/page-layout.tsx";
import { getAnswerLabel } from "../../../src/inbox/answer-label.ts";
import { InboxRow } from "../../../src/inbox/inbox-row.tsx";
import { isDeferredRow } from "../../../src/inbox/build-inbox.ts";
import { loadInbox } from "../../../src/inbox/load-inbox.ts";
import { createTimeFormatter } from "../../../src/projects/format-time.ts";
import { loadScanStatus } from "../../../src/scan/scan-status.ts";
import { InlineMarkdown } from "../../../src/shell/inline-markdown.tsx";
import { SectionCard } from "../../../src/shell/section-card.tsx";
import { EmptyState } from "../../../src/shell/empty-page.tsx";
import { answerEntryAction } from "./answer/actions.ts";

export default async function InboxPage() {
  const copy = getMessages(config.locale).inbox;
  const [inbox, scan] = await Promise.all([loadInbox(), loadScanStatus()]);
  const formatTime = createTimeFormatter(config.locale, config.timezone);
  const waiting = inbox.rows.filter((row) => !isDeferredRow(row));
  const deferred = inbox.rows.filter(isDeferredRow);
  const lastScan = scan.lastSucceededAt === null ? copy.neverScanned : fillMessage(copy.lastScan, { time: formatTime(scan.lastSucceededAt) });
  return (
    <PageLayout title={copy.title} description={copy.description}>
      {waiting.length === 0 ? (
        <EmptyState icon={Inbox} title={copy.emptyTitle} description={`${copy.emptyDescription} ${lastScan}`} />
      ) : (
        <SectionCard id="waiting-heading" title={copy.waitingTitle} count={waiting.length} description={lastScan}>
          <List aria-label={copy.listLabel} density="roomy">
            {waiting.map((row) => (
              <InboxRow key={`${row.projectKey}:${row.entry.id}`} row={row} copy={copy} answerAction={answerEntryAction} />
            ))}
          </List>
        </SectionCard>
      )}
      {deferred.length === 0 ? null : (
        <SectionCard id="deferred-heading" title={copy.deferredTitle} count={deferred.length} description={copy.deferredHint}>
          <List aria-label={copy.deferredLabel} density="roomy">
            {deferred.map((row) => (
              <InboxRow key={`${row.projectKey}:${row.entry.id}`} row={row} copy={copy} answerAction={answerEntryAction} />
            ))}
          </List>
        </SectionCard>
      )}
      {inbox.history.length === 0 ? null : (
        <SectionCard id="answered-earlier" title={copy.historyTitle} description={copy.historyHint}>
          <List aria-label={copy.historyLabel} density="roomy">
            {inbox.history.map((answer) => (
              <li key={`${answer.projectName}#${String(answer.issueNumber)}`} className="grid gap-1 py-3">
                <p className="min-w-0 break-words text-muted-foreground">
                  <InlineMarkdown text={answer.entryText} />
                </p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-small">
                  <Link href={`/projects/${answer.projectName}`} className="font-medium hover:underline">
                    {answer.projectName}
                  </Link>
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
