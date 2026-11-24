// The inbox's tabs: "All" and one per project with entries (waiting or later), each a link that keeps the shown tab
// in the address (`?project=owner/name`). A project tab carries a short code instead of `owner/name`.
import type { InboxRow } from "./build-inbox.ts";
import { isDeferredRow } from "./build-inbox.ts";

export const ALL_TAB_KEY = "all";

export interface InboxTabsInput {
  /** The inbox's path, without a query. */
  readonly basePath: string;
  /** The `project` query parameter as the address carries it. */
  readonly requested: string | undefined;
  readonly rows: readonly InboxRow[];
}

export interface InboxTab {
  /** `all`, or the project's full name. */
  readonly key: string;
  /** The short code of a project tab; null for All, whose label comes from the messages. */
  readonly label: string | null;
  readonly projectName: string | null;
  /** Entries waiting for an answer (later ones not counted). */
  readonly count: number;
  readonly href: string;
}

export interface InboxTabs {
  readonly tabs: readonly InboxTab[];
  readonly current: string;
}

function getRepositoryName(fullName: string): string {
  return fullName.split("/").at(-1) ?? fullName;
}

function getInitials(name: string): string | null {
  const words = name.split(/[_\-.\s]+/).filter((word) => word.length > 0);
  return words.length < 2 ? null : words.map((word) => word.charAt(0)).join("").toUpperCase();
}

/**
 * The tab label of each project: the initials of its repository name's words (`ORDER_TRACKER` → `OT`), or the bare
 * repository name when the name is one word or its initials would repeat another project's label.
 */
export function getProjectTabLabels(fullNames: readonly string[]): ReadonlyMap<string, string> {
  const unique = [...new Set(fullNames)];
  const codes = new Map(unique.map((fullName) => [fullName, getInitials(getRepositoryName(fullName))]));
  const codeUses = new Map<string, number>();
  for (const code of codes.values()) {
    if (code !== null) {
      codeUses.set(code, (codeUses.get(code) ?? 0) + 1);
    }
  }
  return new Map(
    unique.map((fullName) => {
      const code = codes.get(fullName) ?? null;
      return [fullName, code !== null && codeUses.get(code) === 1 ? code : getRepositoryName(fullName)];
    }),
  );
}

export function buildInboxTabs(input: InboxTabsInput): InboxTabs {
  const waitingByProject = new Map<string, number>();
  for (const row of input.rows) {
    waitingByProject.set(row.projectName, (waitingByProject.get(row.projectName) ?? 0) + (isDeferredRow(row) ? 0 : 1));
  }
  const labels = getProjectTabLabels([...waitingByProject.keys()]);
  const projectTabs = [...waitingByProject.entries()]
    .map(([projectName, count]): InboxTab => ({
      key: projectName,
      label: labels.get(projectName) ?? getRepositoryName(projectName),
      projectName,
      count,
      href: `${input.basePath}?project=${projectName}`,
    }))
    .sort((left, right) => (left.label ?? "").localeCompare(right.label ?? ""));
  const allCount = [...waitingByProject.values()].reduce((sum, count) => sum + count, 0);
  const tabs: InboxTab[] = [{ key: ALL_TAB_KEY, label: null, projectName: null, count: allCount, href: input.basePath }, ...projectTabs];
  const requested = input.requested;
  const current = requested !== undefined && projectTabs.some((tab) => tab.key === requested) ? requested : ALL_TAB_KEY;
  return { tabs, current };
}
