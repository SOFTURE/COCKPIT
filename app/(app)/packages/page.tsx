// The Packages page (CT-1): per watched project the last nightly package update, its held packages and how far each
// SOFTURE package is behind the newest on npm.
import { AppLink } from "../../../src/shell/app-link.tsx";
import { Package } from "lucide-react";
import { fillMessage, getMessages } from "../../../messages/index.ts";
import config from "../../../softure.config.ts";
import { loadPackagesPage } from "../../../src/adapters/packages/load-packages.ts";
import { countBehind, PackagesDetails } from "../../../src/adapters/packages/packages-details.tsx";
import { createTimeFormatter } from "../../../src/projects/format-time.ts";
import { loadScanStatus } from "../../../src/scan/scan-status.ts";
import { EmptyState } from "../../../src/shell/empty-page.tsx";
import { PageLayout } from "../../../src/shell/page-layout.tsx";
import { SectionCard } from "../../../src/shell/section-card.tsx";

export default async function PackagesPage() {
  const copy = getMessages(config.locale).packages;
  const [page, scan] = await Promise.all([loadPackagesPage(), loadScanStatus()]);
  const formatTime = createTimeFormatter(config.locale, config.timezone);
  const lastScan = scan.lastSucceededAt === null ? copy.neverScanned : fillMessage(copy.lastScan, { time: formatTime(scan.lastSucceededAt) });
  return (
    <PageLayout title={copy.title} description={copy.description}>
      {page.rows.length === 0 ? (
        <EmptyState icon={Package} title={copy.emptyTitle} description={copy.emptyDescription} />
      ) : (
        <>
          <p className="text-small text-muted-foreground">{lastScan}</p>
          {page.rows.map((row, index) => {
            const behind = row.view.kind === "state" ? countBehind(row.view.state) : 0;
            return (
              <SectionCard
                key={row.key}
                id={`packages-project-${String(index)}`}
                title={row.fullName}
                description={behind === 0 ? undefined : fillMessage(copy.behindCount, { count: behind })}
                action={
                  <AppLink href={`/projects/${row.fullName}`} className="text-small underline underline-offset-2">
                    {copy.openProject}
                  </AppLink>
                }
              >
                <PackagesDetails view={row.view} copy={copy} webUrl={page.webUrl} fullName={row.fullName} formatTime={formatTime} />
              </SectionCard>
            );
          })}
        </>
      )}
    </PageLayout>
  );
}
