// A project's Settings tab (CT-31): one card "Group" with the project's group select, and a link to where the groups
// are defined (Settings → Project groups), which asks to add groups first when none exists.
import Link from "next/link";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import type { GroupRef } from "../projects/group-projects.ts";
import { SectionCard } from "../shell/section-card.tsx";
import { buildProjectGroupOptions } from "./project-group-options.ts";
import { ProjectGroupSelect, type ProjectGroupSaveResult } from "./project-group-select.tsx";

export interface ProjectSettingsSectionProps {
  readonly repositoryKey: string;
  readonly groupId: number | null;
  readonly groups: readonly GroupRef[];
  readonly collator: Intl.Collator;
  readonly copy: AppMessages["projectSettings"];
  readonly action: (formData: FormData) => Promise<ProjectGroupSaveResult>;
}

export function ProjectSettingsSection({ repositoryKey, groupId, groups, collator, copy, action }: ProjectSettingsSectionProps) {
  return (
    <SectionCard id="project-group-heading" title={copy.heading}>
      <ul className="grid">
        <ProjectGroupSelect
          repositoryKey={repositoryKey}
          options={buildProjectGroupOptions(groups, groupId, collator)}
          copy={{
            title: copy.groupTitle,
            hint: copy.groupHint,
            helpLabel: fillMessage(copy.fieldHelpLabel, { field: copy.groupTitle }),
            noGroup: copy.noGroup,
            saved: copy.saved,
          }}
          action={action}
        />
      </ul>
      <Link
        href="/settings#project-groups-heading"
        className="mt-2 inline-flex min-h-touch-target items-center text-small underline underline-offset-2 md:min-h-7"
        data-manage-groups
      >
        {groups.length === 0 ? copy.addGroups : copy.manageGroups}
      </Link>
    </SectionCard>
  );
}
