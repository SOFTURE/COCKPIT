import { PageHeader, Status } from "@softure-ai/theme-notion";
import { CircleCheck, Inbox, Send } from "lucide-react";
import { fillMessage, getMessages } from "../../../messages/index.ts";
import config from "../../../softure.config.ts";
import { InboxRow } from "../../../src/inbox/inbox-row.tsx";
import { answerEntryAction } from "./answer/actions.ts";
import { loadInbox } from "../../../src/inbox/load-inbox.ts";
import { createTimeFormatter } from "../../../src/projects/format-time.ts";
import { loadScanStatus } from "../../../src/scan/scan-status.ts";
import { EmptyState } from "../../../src/shell/empty-page.tsx";

export default async function InboxPage() {
  const copy = getMessages(config.locale).inbox;
  const [inbox, scan] = await Promise.all([loadInbox(), loadScanStatus()]);
  const formatTime = createTimeFormatter(config.locale, config.timezone);
  const lastScan = scan.lastSucceededAt === null ? copy.neverScanned : fillMessage(copy.lastScan, { time: formatTime(scan.lastSucceededAt) });
  return (
    <>
      <PageHeader title={copy.title} description={copy.description} />
      {inbox.rows.length === 0 ? (
        <EmptyState icon={Inbox} title={copy.emptyTitle} description={`${copy.emptyDescription} ${lastScan}`} />
      ) : (
        <>
          <p className="text-small text-muted-foreground">{lastScan}</p>
          <ul aria-label={copy.listLabel} className="grid divide-y divide-border border-b border-border">
            {inbox.rows.map((row) => (
              <InboxRow key={`${row.projectKey}:${row.entry.id}`} row={row} copy={copy} answerAction={answerEntryAction} />
            ))}
          </ul>
        </>
      )}
      {inbox.history.length === 0 ? null : (
        <section aria-labelledby="answered-earlier" className="mt-8 grid gap-2">
          <h2 id="answered-earlier" className="text-heading-3">
            {copy.historyTitle}
          </h2>
          <ul aria-label={copy.historyLabel} className="grid divide-y divide-border border-b border-border">
            {inbox.history.map((answer) => (
              <li key={`${answer.projectName}#${String(answer.issueNumber)}`} className="grid gap-1 py-3">
                <p className="min-w-0 break-words text-muted-foreground">{answer.entryText}</p>
                <div className="flex flex-wrap items-center gap-2 text-small">
                  <span>{answer.projectName}</span>
                  <Status color={answer.done ? "green" : "blue"} icon={answer.done ? CircleCheck : Send}>
                    {answer.done ? copy.done : copy.sent}
                  </Status>
                  <a href={answer.issueUrl} className="underline underline-offset-2" rel="noreferrer" target="_blank">
                    {fillMessage(copy.answerIssue, { answer: copy.answers[answer.answer], number: answer.issueNumber })}
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
