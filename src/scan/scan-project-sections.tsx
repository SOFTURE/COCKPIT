// The projects on Scan status in the owner's project groups (CT-35), laid out like the Projects page (CT-32): one
// section per group with its count, No group last, each project in its unchanged `ScanProjectRow`, in watch order.
import { type AppMessages } from "../../messages/index.ts";
import { groupProjects, type GroupRef } from "../projects/group-projects.ts";
import { ProjectGroupSections } from "../projects/project-group-sections.tsx";
import { ScanProjectRow } from "./scan-project-row.tsx";
import type { ProjectScanRow } from "./scan-status.ts";

export interface ScanProjectSectionsProps {
  readonly projects: readonly ProjectScanRow[];
  readonly groups: readonly GroupRef[];
  readonly collator: Intl.Collator;
  readonly copy: AppMessages["scan"];
  readonly sectionsCopy: AppMessages["projectGroupSections"];
  readonly formatTime: (date: Date) => string;
}

export function ScanProjectSections({ projects, groups, collator, copy, sectionsCopy, formatTime }: ScanProjectSectionsProps) {
  return (
    <ProjectGroupSections
      sections={groupProjects(projects, groups, { collator })}
      copy={sectionsCopy}
      listLabel={copy.listLabel}
      getKey={(project) => project.key}
      renderRow={(project) => <ScanProjectRow project={project} copy={copy} formatTime={formatTime} />}
    />
  );
}
