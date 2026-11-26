// The one way every grouped surface (the projects list, the sidebar, the pickers) lays out projects by the owner's
// groups (CT-30): groups in the locale's name order, each with its projects in the caller's order, an empty group left
// out, and "No group" last and only when it holds a project. No surface sorts or groups on its own.

export interface GroupRef {
  readonly id: number;
  readonly name: string;
}

export interface GroupedProject {
  /** The project's group; null for "No group". */
  readonly groupId: number | null;
}

export interface ProjectGroupSection<P> {
  /** Null for the "No group" section. */
  readonly group: GroupRef | null;
  readonly projects: readonly P[];
}

export interface GroupProjectsOptions {
  readonly collator: Intl.Collator;
}

/** The app's collator for group names: the locale's alphabet, letters compared without case or accents first. */
export function createGroupCollator(locale: string): Intl.Collator {
  return new Intl.Collator(locale, { sensitivity: "base", numeric: true });
}

/** Group names in the locale's order; equal names under the collator keep a stable order by id. */
export function sortGroups<G extends GroupRef>(groups: readonly G[], { collator }: GroupProjectsOptions): G[] {
  return [...groups].sort((left, right) => collator.compare(left.name, right.name) || left.id - right.id);
}

export function groupProjects<P extends GroupedProject>(
  projects: readonly P[],
  groups: readonly GroupRef[],
  options: GroupProjectsOptions,
): ProjectGroupSection<P>[] {
  const byGroup = new Map<number | null, P[]>();
  for (const project of projects) {
    const known = project.groupId !== null && groups.some((group) => group.id === project.groupId);
    const key = known ? project.groupId : null;
    byGroup.set(key, [...(byGroup.get(key) ?? []), project]);
  }
  const sections: ProjectGroupSection<P>[] = sortGroups(groups, options)
    .filter((group) => byGroup.has(group.id))
    .map((group) => ({ group: { id: group.id, name: group.name }, projects: byGroup.get(group.id) ?? [] }));
  const ungrouped = byGroup.get(null);
  return ungrouped === undefined ? sections : [...sections, { group: null, projects: ungrouped }];
}
