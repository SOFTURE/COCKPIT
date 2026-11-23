import { PageHeader } from "@softure-ai/theme-notion";
import { Inbox } from "lucide-react";
import { fillMessage, getMessages } from "../../../messages/index.ts";
import config from "../../../softure.config.ts";
import { InboxRow } from "../../../src/inbox/inbox-row.tsx";
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
              <InboxRow key={`${row.projectKey}:${row.entry.id}`} row={row} copy={copy} />
            ))}
          </ul>
        </>
      )}
    </>
  );
}
