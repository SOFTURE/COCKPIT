// The tabs of a project's page (CT-5): Waiting, Roadmaps, Changes, Routines (CT-10) and, when health or deploy
// reports, Production, each a link that keeps the shown tab in the address. The shown tab is the requested one when it is available,
// otherwise the first tab with something in it, otherwise Waiting.

export const PROJECT_TAB_KEYS = ["waiting", "roadmaps", "changes", "routines", "production"] as const;

export type ProjectTabKey = (typeof PROJECT_TAB_KEYS)[number];

export interface ProjectTabsInput {
  /** The project page's path, without a query. */
  readonly basePath: string;
  /** The `tab` query parameter as the address carries it. */
  readonly requested: string | undefined;
  readonly entries: number;
  /** The active roadmap (0 or 1) plus the queued ones; null when no state was read. */
  readonly roadmaps: number | null;
  /** The open changes; null when no state was read. */
  readonly changes: number | null;
  /** The project's routines; Routines is always shown but never picked as the default tab. */
  readonly routines: number;
  readonly hasProduction: boolean;
}

export interface ProjectTab {
  readonly key: ProjectTabKey;
  /** Undefined when the tab shows no counter. */
  readonly count: number | undefined;
  readonly href: string;
}

export interface ProjectTabs {
  readonly tabs: readonly ProjectTab[];
  readonly current: ProjectTabKey;
}

function isProjectTabKey(value: string): value is ProjectTabKey {
  return (PROJECT_TAB_KEYS as readonly string[]).includes(value);
}

function hasContent(tab: ProjectTab): boolean {
  return tab.key === "production" || (tab.key !== "routines" && (tab.count ?? 0) > 0);
}

export function buildProjectTabs(input: ProjectTabsInput): ProjectTabs {
  const tab = (key: ProjectTabKey, count: number | undefined): ProjectTab => ({ key, count, href: `${input.basePath}?tab=${key}` });
  const tabs = [
    tab("waiting", input.entries),
    tab("roadmaps", input.roadmaps ?? undefined),
    tab("changes", input.changes ?? undefined),
    tab("routines", input.routines),
    ...(input.hasProduction ? [tab("production", undefined)] : []),
  ];
  const requested = input.requested;
  if (requested !== undefined && isProjectTabKey(requested) && tabs.some((candidate) => candidate.key === requested)) {
    return { tabs, current: requested };
  }
  return { tabs, current: tabs.find(hasContent)?.key ?? "waiting" };
}
