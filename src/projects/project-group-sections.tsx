// The one way a list of projects is shown in the owner's groups (CT-32): one section per group from `groupProjects`
// (CT-30), each with the group's name and a muted count over the caller's rows. It owns the heading, the count and the
// spacing, so no screen draws its own group heading; an empty list draws nothing. The rows sit in a theme list (`list`,
// the default), or, for a screen whose rows are cards (Packages, CT-35), one under the other (`stack`).
import { List } from "@softure-ai/theme-notion";
import { Fragment, type ReactNode } from "react";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import type { ProjectGroupSection } from "./group-projects.ts";

interface CommonProps<P> {
  readonly sections: readonly ProjectGroupSection<P>[];
  readonly copy: AppMessages["projectGroupSections"];
  readonly getKey: (project: P) => string;
}

type ListLayoutProps<P> = CommonProps<P> & {
  readonly layout?: "list";
  /** The label of each section's list, with `{group}` for the group's name (e.g. "Projects: {group}"). */
  readonly listLabel: string;
  /** One project's row: its theme `ListItem`. */
  readonly renderRow: (project: P) => ReactNode;
};

type StackLayoutProps<P> = CommonProps<P> & {
  readonly layout: "stack";
  /** One project's block (a card), shown one under the other. */
  readonly renderRow: (project: P) => ReactNode;
};

export type ProjectGroupSectionsProps<P> =
  | ListLayoutProps<P>
  | StackLayoutProps<P>;

function SectionRows<P>({ props, projects, name }: { readonly props: ProjectGroupSectionsProps<P>; readonly projects: readonly P[]; readonly name: string }) {
  const rows = projects.map((project) => <Fragment key={props.getKey(project)}>{props.renderRow(project)}</Fragment>);
  if (props.layout === "stack") {
    return (
      <div className="grid gap-4" data-slot="project-group-stack">
        {rows}
      </div>
    );
  }
  return (
    <List aria-label={fillMessage(props.listLabel, { group: name })} density="roomy" className="border-y border-border">
      {rows}
    </List>
  );
}

// The props stay whole (`...props`) so `SectionRows` can tell the layouts apart.
export function ProjectGroupSections<P>({ ...props }: ProjectGroupSectionsProps<P>) {
  const { sections, copy } = props;
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
            <SectionRows props={props} projects={section.projects} name={name} />
          </section>
        );
      })}
    </div>
  );
}
