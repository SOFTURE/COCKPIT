// The tabs of a project's page (CT-5): Waiting, Roadmaps, Changes, Routines (CT-10), Production when health or deploy
// reports, and Settings (CT-31) last, always shown and without a counter, each a link that keeps the shown tab in the address. The shown tab is the requested one when it is available,
// otherwise Waiting, whatever the other tabs hold (CT-29): what waits for the owner always comes first.
import { pickTab, tabHref } from "../shell/pick-tab.ts";

export const PROJECT_TAB_KEYS = ["waiting", "roadmaps", "changes", "routines", "production", "settings"] as const;

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
  /** The project's routines; Routines is always shown. */
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

export function buildProjectTabs(input: ProjectTabsInput): ProjectTabs {
  const tab = (key: ProjectTabKey, count: number | undefined): ProjectTab => ({ key, count, href: tabHref(input.basePath, key) });
  const tabs = [
    tab("waiting", input.entries),
    tab("roadmaps", input.roadmaps ?? undefined),
    tab("changes", input.changes ?? undefined),
    tab("routines", input.routines),
    ...(input.hasProduction ? [tab("production", undefined)] : []),
    tab("settings", undefined),
  ];
  return { tabs, current: pickTab(tabs.map((candidate) => candidate.key), input.requested, "waiting") };
}
