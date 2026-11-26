// The Packages page's project cards in the owner's project groups (CT-35), laid out like the Projects page (CT-32): one
// section per group with its count, No group last, each project's card unchanged (its name, how many packages are
// behind, the link to the project and its details), one under the other in watch order.
import { fillMessage, type AppMessages } from "../../../messages/index.ts";
import { AppLink } from "../../shell/app-link.tsx";
import { SectionCard } from "../../shell/section-card.tsx";
import { groupProjects, type GroupRef } from "../../projects/group-projects.ts";
import { ProjectGroupSections } from "../../projects/project-group-sections.tsx";
import type { PackagesRow } from "./load-packages.ts";
import { countBehind, PackagesDetails } from "./packages-details.tsx";

export interface PackagesSectionsProps {
  readonly rows: readonly PackagesRow[];
  readonly groups: readonly GroupRef[];
  readonly collator: Intl.Collator;
  readonly copy: AppMessages["packages"];
  readonly sectionsCopy: AppMessages["projectGroupSections"];
  /** The forge's web origin, for issue links. */
  readonly webUrl: string;
  readonly formatTime: (date: Date) => string;
}

export function PackagesSections({ rows, groups, collator, copy, sectionsCopy, webUrl, formatTime }: PackagesSectionsProps) {
  // Each card's heading id stays its place in watch order, whatever group it sits in.
  const indexByKey = new Map(rows.map((row, index) => [row.key, index]));
  return (
    <ProjectGroupSections
      layout="stack"
      sections={groupProjects(rows, groups, { collator })}
      copy={sectionsCopy}
      getKey={(row) => row.key}
      renderRow={(row) => {
        const behind = row.view.kind === "state" ? countBehind(row.view.state) : 0;
        return (
          <SectionCard
            id={`packages-project-${String(indexByKey.get(row.key) ?? 0)}`}
            title={row.fullName}
            description={behind === 0 ? undefined : fillMessage(copy.behindCount, { count: behind })}
            action={
              <AppLink href={`/projects/${row.fullName}`} className="text-small underline underline-offset-2">
                {copy.openProject}
              </AppLink>
            }
          >
            <PackagesDetails view={row.view} copy={copy} webUrl={webUrl} fullName={row.fullName} formatTime={formatTime} />
          </SectionCard>
        );
      }}
    />
  );
}
