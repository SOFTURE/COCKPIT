// The overview (FR-7, FR-8): every watched project with its status and the numbers behind it, in the owner's project
// groups (CT-32); inside a group broken first, idle last, then by name.
import { FolderKanban } from "lucide-react";
import { fillMessage, getMessages } from "../../../messages/index.ts";
import config from "../../../softure.config.ts";
import { PageLayout } from "../../../src/shell/page-layout.tsx";
import { loadInbox } from "../../../src/inbox/load-inbox.ts";
import { loadOverview } from "../../../src/overview/load-overview.ts";
import { OverviewRow } from "../../../src/overview/overview-row.tsx";
import { createTimeFormatter } from "../../../src/projects/format-time.ts";
import { createGroupCollator, groupProjects } from "../../../src/projects/group-projects.ts";
import { loadProjectGroups } from "../../../src/projects/load-project-groups.ts";
import { ProjectGroupSections } from "../../../src/projects/project-group-sections.tsx";
import { loadScanStatus } from "../../../src/scan/scan-status.ts";
import { EmptyState } from "../../../src/shell/empty-page.tsx";

export default async function ProjectsPage() {
  const messages = getMessages(config.locale);
  const copy = messages.overview;
  const [inbox, scan, groups] = await Promise.all([loadInbox(), loadScanStatus(), loadProjectGroups()]);
  const overview = await loadOverview(inbox);
  const formatTime = createTimeFormatter(config.locale, config.timezone);
  const lastScan = scan.lastSucceededAt === null ? copy.neverScanned : fillMessage(copy.lastScan, { time: formatTime(scan.lastSucceededAt) });
  const sections = groupProjects(overview.rows, groups, { collator: createGroupCollator(config.locale) });
  return (
    <PageLayout title={copy.title} description={copy.description}>
      {sections.length === 0 ? (
        <EmptyState icon={FolderKanban} title={copy.emptyTitle} description={copy.emptyDescription} />
      ) : (
        <div className="grid gap-6">
          <p className="text-small text-muted-foreground">{lastScan}</p>
          <ProjectGroupSections
            sections={sections}
            copy={messages.projectGroupSections}
            listLabel={messages.projectGroupSections.projectsListLabel}
            getKey={(row) => row.key}
            renderRow={(row) => (
              <OverviewRow row={row} copy={copy} healthCopy={messages.health} wakeCopy={messages.wake} driftCopy={messages.drift} formatTime={formatTime} />
            )}
          />
        </div>
      )}
    </PageLayout>
  );
}
