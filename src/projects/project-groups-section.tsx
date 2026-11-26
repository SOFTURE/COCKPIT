// The "Project groups" card on Settings (CT-30), between Watched repositories and Team: the add form, then the groups in
// the locale's name order (empty ones too, so they can be renamed or deleted), each a theme `ListEntry` with its name,
// one muted line "N projects · new from: owner" and its row menu.
import { List, ListEntry, ListItem } from "@softure-ai/theme-notion";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import type { ProjectGroupWithCount } from "../../modules/projects/groups.ts";
import { SectionCard } from "../shell/section-card.tsx";
import type { ProjectGroupFormAction } from "./project-group-form-state.ts";
import { AddProjectGroupForm, ProjectGroupRowMenu, type ProjectGroupRowActions } from "./project-group-forms.tsx";
import { formatCount } from "./project-group-copy.ts";
import { createGroupCollator, sortGroups } from "./group-projects.ts";

export interface ProjectGroupsSectionProps {
  readonly copy: AppMessages["projectGroups"];
  readonly locale: string;
  readonly groups: readonly ProjectGroupWithCount[];
  readonly actions: ProjectGroupRowActions & { readonly add: ProjectGroupFormAction };
}

function getDetail(copy: AppMessages["projectGroups"], locale: string, group: ProjectGroupWithCount): string {
  const count = formatCount(locale, copy.projectCount, group.projectCount);
  return group.defaultOwner === null ? count : `${count} · ${fillMessage(copy.newFrom, { owner: group.defaultOwner })}`;
}

export function ProjectGroupsSection({ copy, locale, groups, actions }: ProjectGroupsSectionProps) {
  const sorted = sortGroups(groups, { collator: createGroupCollator(locale) });
  return (
    <SectionCard id="project-groups-heading" title={copy.heading} description={copy.description}>
      <div className="grid gap-4">
        <AddProjectGroupForm copy={copy} action={actions.add} />
        {sorted.length === 0 ? (
          <p className="border-t border-border pt-4 text-small text-muted-foreground" data-groups-empty>
            {copy.empty}
          </p>
        ) : (
          <List aria-label={copy.listLabel} density="roomy" className="border-t border-border">
            {sorted.map((group) => (
              <ListItem key={group.id} data-group-row={group.id}>
                <ListEntry
                  title={group.name}
                  details={<p className="text-small text-muted-foreground" data-group-detail>{getDetail(copy, locale, group)}</p>}
                  menu={
                    <ProjectGroupRowMenu
                      copy={copy}
                      group={group}
                      deleteHint={formatCount(locale, copy.deleteHint, group.projectCount)}
                      actions={{ rename: actions.rename, remove: actions.remove }}
                    />
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </div>
    </SectionCard>
  );
}
