// The one way a list of projects is shown in the owner's groups (CT-32): one section per group from `groupProjects`
// (CT-30), each with the group's name and a muted count over a theme list of the caller's rows. It owns the heading,
// the count and the spacing, so no screen draws its own group heading; an empty list draws nothing.
import { List } from "@softure-ai/theme-notion";
import { Fragment, type ReactNode } from "react";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import type { ProjectGroupSection } from "./group-projects.ts";

export interface ProjectGroupSectionsProps<P> {
  readonly sections: readonly ProjectGroupSection<P>[];
  readonly copy: AppMessages["projectGroupSections"];
  /** The label of each section's list, with `{group}` for the group's name (e.g. "Projects: {group}"). */
  readonly listLabel: string;
  readonly getKey: (project: P) => string;
  /** One project's row: its theme `ListItem`. */
  readonly renderRow: (project: P) => ReactNode;
}

export function ProjectGroupSections<P>({ sections, copy, listLabel, getKey, renderRow }: ProjectGroupSectionsProps<P>) {
  if (sections.length === 0) {
    return null;
  }
  return (
    <div className="grid gap-6" data-slot="project-group-sections">
      {sections.map((section) => {
        const name = section.group === null ? copy.noGroup : section.group.name;
        return (
          <section key={section.group?.id ?? "none"} aria-label={fillMessage(copy.sectionLabel, { name })} className="grid gap-1" data-group={section.group?.id ?? "none"}>
            <h2 className="flex items-baseline gap-2 text-ui font-semibold">
              <span>{name}</span>
              <span className="text-small font-normal text-muted-foreground" data-slot="project-group-count">
                {section.projects.length}
              </span>
            </h2>
            <List aria-label={fillMessage(listLabel, { group: name })} density="roomy" className="border-y border-border">
              {section.projects.map((project) => (
                <Fragment key={getKey(project)}>{renderRow(project)}</Fragment>
              ))}
            </List>
          </section>
        );
      })}
    </div>
  );
}
