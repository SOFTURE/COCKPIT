import { fillMessage, getMessages } from "../../../messages/index.ts";
import config from "../../../softure.config.ts";
import { PageLayout } from "../../../src/shell/page-layout.tsx";
import { SectionCard } from "../../../src/shell/section-card.tsx";
import { createTimeFormatter } from "../../../src/projects/format-time.ts";
import { ScanProjectRow } from "../../../src/scan/scan-project-row.tsx";
import { ScanNowButton } from "../../../src/scan/scan-now-button.tsx";
import { loadScanStatus } from "../../../src/scan/scan-status.ts";
import { scanNowAction } from "./actions.ts";

export default async function ScanStatusPage() {
  const copy = getMessages(config.locale).scan;
  const status = await loadScanStatus();
  const formatTime = createTimeFormatter(config.locale, config.timezone);
  return (
    <PageLayout title={copy.title} description={copy.description}>
      <SectionCard id="scan-schedule-heading" title={copy.scheduleHeading}>
        <div className="grid gap-2">
          {status.intervalMinutes === null ? null : (
            <p className="text-small text-muted-foreground">{fillMessage(copy.interval, { minutes: status.intervalMinutes })}</p>
          )}
          <p className="text-small text-muted-foreground">
            {status.lastSucceededAt === null ? copy.neverScanned : fillMessage(copy.lastScan, { time: formatTime(status.lastSucceededAt) })}
          </p>
          {status.isScanning ? <p className="text-small text-muted-foreground">{copy.running}</p> : null}
          {status.failureCode === null ? null : (
            <p className="text-small text-destructive">{fillMessage(copy.failing, { code: status.failureCode })}</p>
          )}
          <ScanNowButton copy={copy} isScanning={status.isScanning} action={scanNowAction} />
        </div>
      </SectionCard>
      <SectionCard id="scan-projects-heading" title={copy.projectsHeading} count={status.projects.length}>
        {status.projects.length === 0 ? (
          <p className="text-small text-muted-foreground">{copy.empty}</p>
        ) : (
          <ul aria-label={copy.listLabel} className="grid divide-y divide-border border-t border-border">
            {status.projects.map((project) => (
              <ScanProjectRow key={project.key} project={project} copy={copy} formatTime={formatTime} />
            ))}
          </ul>
        )}
      </SectionCard>
    </PageLayout>
  );
}
