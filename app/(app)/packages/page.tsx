// The Packages page (CT-1): per watched project the last nightly package update, its held packages and how far each
// SOFTURE package is behind the newest on npm, in the owner's project groups (CT-35).
import { Package } from "lucide-react";
import { fillMessage, getMessages } from "../../../messages/index.ts";
import config from "../../../softure.config.ts";
import { loadPackagesPage } from "../../../src/adapters/packages/load-packages.ts";
import { PackagesSections } from "../../../src/adapters/packages/packages-sections.tsx";
import { createTimeFormatter } from "../../../src/projects/format-time.ts";
import { createGroupCollator } from "../../../src/projects/group-projects.ts";
import { loadProjectGroups } from "../../../src/projects/load-project-groups.ts";
import { loadScanStatus } from "../../../src/scan/scan-status.ts";
import { EmptyState } from "../../../src/shell/empty-page.tsx";
import { PageLayout } from "../../../src/shell/page-layout.tsx";

export default async function PackagesPage() {
  const messages = getMessages(config.locale);
  const copy = messages.packages;
  const [page, scan, groups] = await Promise.all([loadPackagesPage(), loadScanStatus(), loadProjectGroups()]);
  const formatTime = createTimeFormatter(config.locale, config.timezone);
  const lastScan = scan.lastSucceededAt === null ? copy.neverScanned : fillMessage(copy.lastScan, { time: formatTime(scan.lastSucceededAt) });
  return (
    <PageLayout title={copy.title} description={copy.description}>
      {page.rows.length === 0 ? (
        <EmptyState icon={Package} title={copy.emptyTitle} description={copy.emptyDescription} />
      ) : (
        <>
          <p className="text-small text-muted-foreground">{lastScan}</p>
          <PackagesSections
            rows={page.rows}
            groups={groups}
            collator={createGroupCollator(config.locale)}
            copy={copy}
            sectionsCopy={messages.projectGroupSections}
            webUrl={page.webUrl}
            formatTime={formatTime}
          />
        </>
      )}
    </PageLayout>
  );
}
