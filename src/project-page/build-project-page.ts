// A project's page (FR-10): its active roadmap items with their stages in roadmap order, its queued roadmaps with
// their start condition, its open changes, the owner's entries for this project and links into the repository, from
// the scan's last good read. A failed read keeps the last good data and names the failure with its time.
import type { ProjectRead, ReadStatus } from "../../modules/projects/reads.ts";
import { createRepositoryLinks, type RepositoryLinks } from "../forge/web-url.ts";
import type { InboxRow } from "../inbox/build-inbox.ts";
import { ACTIVE_ROADMAP_SLUG } from "../roadmap/build-roadmap-view.ts";
import { projectStateSchema, type ProjectState } from "../state/state-schema.ts";

export interface ProjectPageInput {
  readonly repository: { readonly key: string; readonly fullName: string; readonly defaultBranch: string };
  /** The scan's read of this project; undefined before the first one. */
  readonly read: ProjectRead | undefined;
  /** Every inbox row; the page keeps this project's. */
  readonly inboxRows: readonly InboxRow[];
  /** The forge's web origin (getForgeWebUrl). */
  readonly webUrl: string;
}

export interface ProjectPageItem {
  readonly id: string;
  readonly outcome: string | null;
  readonly status: string;
  /** The item's stage, or its status when the state gives no stage. */
  readonly stage: string;
  readonly since: string | null;
  readonly detail: string | null;
  /** The change folder while the change is open, else null. */
  readonly link: string | null;
}

export interface ProjectPageRoadmap {
  readonly slug: string | null;
  readonly title: string | null;
  readonly done: number;
  readonly total: number;
  /** The roadmap file on the forge. */
  readonly link: string;
  /** The roadmap's view inside COCKPIT. */
  readonly href: string;
  readonly items: readonly ProjectPageItem[];
}

export interface ProjectPageQueued {
  readonly slug: string;
  readonly title: string | null;
  readonly startCondition: string | null;
  readonly done: number;
  readonly total: number;
  /** The roadmap file on the forge. */
  readonly link: string;
  /** The roadmap's view inside COCKPIT. */
  readonly href: string;
}

export interface ProjectPageChange {
  readonly changeId: string;
  readonly title: string | null;
  /** The change's stage, or its status when the state gives no stage; null when it gives neither. */
  readonly stage: string | null;
  readonly roadmapItem: string | null;
  readonly updated: string | null;
  readonly link: string;
}

export interface ProjectPageState {
  readonly updatedAt: string;
  /** Null when the project has no active roadmap. */
  readonly activeRoadmap: ProjectPageRoadmap | null;
  readonly queued: readonly ProjectPageQueued[];
  readonly openChanges: readonly ProjectPageChange[];
}

export interface ProjectPageFailure {
  readonly status: Exclude<ReadStatus, "ok">;
  readonly readAt: Date;
  /** When the state was last read well; null when it never was. */
  readonly lastGoodAt: Date | null;
}

export interface ProjectPage {
  readonly key: string;
  readonly fullName: string;
  readonly readStatus: ReadStatus | "never";
  readonly readAt: Date | null;
  /** Set when the last read failed. */
  readonly failure: ProjectPageFailure | null;
  readonly links: { readonly repository: string };
  /** The last good state; null when there is none. */
  readonly state: ProjectPageState | null;
  readonly entries: readonly InboxRow[];
}

const CHANGES_FOLDER = "context/changes";

/** The scan's stored state, narrowed; null when there is none or it no longer parses. */
export function parseStoredState(read: ProjectRead | undefined): ProjectState | null {
  if (read === undefined || read.state === null || read.state === undefined) {
    return null;
  }
  const parsed = projectStateSchema.safeParse(read.state);
  return parsed.success ? parsed.data : null;
}

function toFailure(read: ProjectRead | undefined): ProjectPageFailure | null {
  if (read === undefined || read.status === "ok") {
    return null;
  }
  return { status: read.status, readAt: read.readAt, lastGoodAt: read.lastGoodAt };
}

/** The in-app address of a roadmap of the project. */
export function getRoadmapHref(fullName: string, slug: string | null): string {
  return `/projects/${fullName}/roadmaps/${encodeURIComponent(slug ?? ACTIVE_ROADMAP_SLUG)}`;
}

function toRoadmap(roadmap: NonNullable<ProjectState["active_roadmap"]>, openChangeIds: ReadonlySet<string>, links: RepositoryLinks, fullName: string): ProjectPageRoadmap {
  return {
    slug: roadmap.slug,
    title: roadmap.title,
    done: roadmap.done,
    total: roadmap.total,
    link: links.file(roadmap.path),
    href: getRoadmapHref(fullName, roadmap.slug),
    items: roadmap.items.map((item) => ({
      id: item.id,
      outcome: item.outcome,
      status: item.status,
      stage: item.stage ?? item.status,
      since: item.since,
      detail: item.detail,
      link: item.change_id !== null && openChangeIds.has(item.change_id) ? links.folder(`${CHANGES_FOLDER}/${item.change_id}`) : null,
    })),
  };
}

function toState(state: ProjectState, links: RepositoryLinks, fullName: string): ProjectPageState {
  const openChangeIds = new Set(state.open_changes.map((change) => change.change_id));
  return {
    updatedAt: state.updated_at,
    activeRoadmap: state.active_roadmap === null ? null : toRoadmap(state.active_roadmap, openChangeIds, links, fullName),
    queued: state.queued.map((roadmap) => ({
      slug: roadmap.slug,
      title: roadmap.title,
      startCondition: roadmap.start_condition,
      done: roadmap.done,
      total: roadmap.total,
      link: links.file(roadmap.path),
      href: getRoadmapHref(fullName, roadmap.slug),
    })),
    openChanges: state.open_changes.map((change) => ({
      changeId: change.change_id,
      title: change.title,
      stage: change.stage ?? change.status,
      roadmapItem: change.roadmap_item,
      updated: change.updated,
      link: links.folder(`${CHANGES_FOLDER}/${change.change_id}`),
    })),
  };
}

export function buildProjectPage({ repository, read, inboxRows, webUrl }: ProjectPageInput): ProjectPage {
  const state = parseStoredState(read);
  const links = createRepositoryLinks(webUrl, repository.fullName, state?.main_branch ?? repository.defaultBranch);
  return {
    key: repository.key,
    fullName: repository.fullName,
    readStatus: read?.status ?? "never",
    readAt: read?.readAt ?? null,
    failure: toFailure(read),
    links: { repository: links.repository },
    state: state === null ? null : toState(state, links, repository.fullName),
    entries: inboxRows.filter((row) => row.projectKey === repository.key),
  };
}
