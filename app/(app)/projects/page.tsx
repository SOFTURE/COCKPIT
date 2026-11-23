// The overview (FR-7, FR-8): every watched project with its status and the numbers behind it, grouped by status.
import { PageHeader } from "@softure-ai/theme-notion";
import { FolderKanban } from "lucide-react";
import { fillMessage, getMessages } from "../../../messages/index.ts";
import config from "../../../softure.config.ts";
import { loadInbox } from "../../../src/inbox/load-inbox.ts";
import { loadOverview } from "../../../src/overview/load-overview.ts";
import { OverviewRow } from "../../../src/overview/overview-row.tsx";
import { createTimeFormatter } from "../../../src/projects/format-time.ts";
import { loadScanStatus } from "../../../src/scan/scan-status.ts";
import { EmptyState } from "../../../src/shell/empty-page.tsx";
import { ProjectStatusBadge } from "../../../src/status/project-status-badge.tsx";

export default async function ProjectsPage() {
  const copy = getMessages(config.locale).overview;
  const [inbox, scan] = await Promise.all([loadInbox(), loadScanStatus()]);
  const overview = await loadOverview(inbox);
  const formatTime = createTimeFormatter(config.locale, config.timezone);
  const lastScan = scan.lastSucceededAt === null ? copy.neverScanned : fillMessage(copy.lastScan, { time: formatTime(scan.lastSucceededAt) });
  return (
    <>
      <PageHeader title={copy.title} description={copy.description} />
      {overview.groups.length === 0 ? (
        <EmptyState icon={FolderKanban} title={copy.emptyTitle} description={copy.emptyDescription} />
      ) : (
        <div className="grid gap-6">
          <p className="text-small text-muted-foreground">{lastScan}</p>
          {overview.groups.map((group) => {
            const label = fillMessage(copy.groupLabel, { status: copy.statuses[group.status] });
            return (
              <section key={group.status} aria-label={label} className="grid gap-1">
                <h2 className="flex items-center gap-2 text-ui font-semibold">
                  <ProjectStatusBadge status={group.status} copy={copy} />
                  <span className="text-small font-normal text-muted-foreground">{group.rows.length}</span>
                </h2>
                <ul aria-label={label} className="grid divide-y divide-border border-y border-border">
                  {group.rows.map((row) => (
                    <OverviewRow key={row.key} row={row} copy={copy} formatTime={formatTime} />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
