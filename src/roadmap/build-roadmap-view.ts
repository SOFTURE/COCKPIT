// One roadmap of a watched project, as the roadmap view shows it: the roadmap file parsed (items in roadmap order with
// their status, outcome, prerequisites, size and the rest of their fields; the run-wide orders; the owner's open
// steps), merged with what the project's state says about it. When the file cannot be read or holds no item, the
// view falls back to the items of the state and says why.
import type { ForgeRead, ForgeReadFailure } from "../forge/client.ts";
import type { ProjectState } from "../state/state-schema.ts";
import { parseRoadmap, parseStatus, type RoadmapCheck, type RoadmapField, type RoadmapItemBlock, type RoadmapOrder, type RoadmapRow } from "./parse-roadmap.ts";

/** The slug of an active roadmap whose state names none. */
export const ACTIVE_ROADMAP_SLUG = "active";

export interface RoadmapTarget {
  readonly kind: "active" | "queued";
  readonly slug: string;
  readonly path: string;
  readonly title: string | null;
  readonly status: string | null;
  readonly startCondition: string | null;
  readonly done: number;
  readonly total: number;
  readonly stateItems: readonly StateItem[];
}

interface StateItem {
  readonly id: string;
  readonly changeId: string | null;
  readonly outcome: string | null;
  readonly status: string;
  readonly stage: string | null;
  readonly detail: string | null;
  readonly prerequisites: readonly string[];
}

export type StatusGroup = "done" | "active" | "blocked" | "ready" | "other";

export interface RoadmapViewItem {
  readonly id: string;
  readonly title: string | null;
  readonly outcome: string | null;
  readonly status: string;
  readonly group: StatusGroup;
  /** The stage from the state while the item is in progress, else the text in the status's parentheses. */
  readonly statusDetail: string | null;
  readonly prerequisites: readonly string[];
  readonly size: string | null;
  readonly changeId: string | null;
  readonly mode: string | null;
  /** Every other field of the item block, in file order. */
  readonly fields: readonly RoadmapField[];
}

export type RoadmapFallbackReason = ForgeReadFailure["kind"] | "unsafe_path" | "no_items" | "not_configured";

export interface RoadmapView {
  readonly kind: "active" | "queued";
  readonly slug: string;
  readonly path: string;
  /** The roadmap's name: the state's title, else the file's heading, else the slug. */
  readonly title: string;
  /** The file's own heading, when it differs from the title. */
  readonly heading: string | null;
  readonly status: string | null;
  readonly version: string | null;
  readonly updated: string | null;
  readonly startCondition: string | null;
  readonly done: number;
  readonly total: number;
  readonly orders: readonly RoadmapOrder[];
  readonly items: readonly RoadmapViewItem[];
  /** The owner's steps and decisions, open ones first. */
  readonly checks: readonly RoadmapCheck[];
  /** Null when the view comes from the file; otherwise why it shows the state's items. */
  readonly fallback: RoadmapFallbackReason | null;
}

const NAMED_FIELDS = new Set(["Change ID", "Status", "Outcome", "Prerequisites", "Size"]);
const ID_RE = /\b[A-Z]+-\d+\b/g;

export function findRoadmapTarget(state: ProjectState, slug: string): RoadmapTarget | null {
  const active = state.active_roadmap;
  if (active !== null && (active.slug === slug || (active.slug === null && slug === ACTIVE_ROADMAP_SLUG))) {
    return {
      kind: "active",
      slug,
      path: active.path,
      title: active.title,
      status: active.status,
      startCondition: null,
      done: active.done,
      total: active.total,
      stateItems: active.items.map((item) => ({
        id: item.id,
        changeId: item.change_id,
        outcome: item.outcome,
        status: item.status,
        stage: item.stage,
        detail: item.detail,
        prerequisites: item.prerequisites,
      })),
    };
  }
  const queued = state.queued.find((candidate) => candidate.slug === slug);
  if (queued === undefined) {
    return null;
  }
  return {
    kind: "queued",
    slug,
    path: queued.path,
    title: queued.title,
    status: queued.status,
    startCondition: queued.start_condition,
    done: queued.done,
    total: queued.total,
    stateItems: queued.items.map((item) => ({ id: item.id, changeId: item.change_id, outcome: item.outcome, status: item.status, stage: null, detail: null, prerequisites: [] })),
  };
}

/** Only markdown files under `context/` are read: the path comes from the project's own, untrusted state. */
export function isReadableRoadmapPath(path: string): boolean {
  return path.startsWith("context/") && path.endsWith(".md") && !path.split("/").some((part) => part === ".." || part === "." || part === "");
}

export function groupStatus(status: string): StatusGroup {
  if (status === "done" || status === "done_code") {
    return "done";
  }
  if (status === "in_progress" || status === "ready_to_merge") {
    return "active";
  }
  if (status === "blocked") {
    return "blocked";
  }
  return status === "ready" ? "ready" : "other";
}

function fieldText(block: RoadmapItemBlock | undefined, label: string): string | null {
  const field = block?.fields.find((candidate) => candidate.label === label);
  if (field === undefined) {
    return null;
  }
  const text = field.text.replace(/^`|`$/g, "").trim();
  return text === "" || text === "—" || text === "-" ? null : text;
}

function fromFile(row: RoadmapRow | undefined, block: RoadmapItemBlock | undefined, stateItem: StateItem | undefined, id: string): RoadmapViewItem {
  const blockStatus = fieldText(block, "Status");
  const status = row?.status ?? (blockStatus === null ? null : parseStatus(blockStatus)) ?? { keyword: stateItem?.status ?? "unknown", detail: null };
  const prerequisites = row !== undefined && row.prerequisites.length > 0 ? row.prerequisites : (fieldText(block, "Prerequisites")?.match(ID_RE) ?? []);
  return {
    id,
    title: block?.title ?? null,
    outcome: fieldText(block, "Outcome") ?? row?.outcome ?? stateItem?.outcome ?? null,
    status: status.keyword,
    group: groupStatus(status.keyword),
    statusDetail: (status.keyword === "in_progress" ? stateItem?.stage : null) ?? status.detail,
    prerequisites,
    size: fieldText(block, "Size"),
    changeId: row?.changeId ?? fieldText(block, "Change ID") ?? stateItem?.changeId ?? null,
    mode: row?.mode ?? null,
    fields: (block?.fields ?? []).filter((field) => !NAMED_FIELDS.has(field.label)),
  };
}

function fromState(item: StateItem): RoadmapViewItem {
  return {
    id: item.id,
    title: null,
    outcome: item.outcome,
    status: item.status,
    group: groupStatus(item.status),
    statusDetail: item.stage ?? item.detail,
    prerequisites: item.prerequisites,
    size: null,
    changeId: item.changeId,
    mode: null,
    fields: [],
  };
}

export interface BuildRoadmapViewInput {
  readonly target: RoadmapTarget;
  /** The file's read; null when no forge access is configured. */
  readonly file: ForgeRead<string> | null;
}

export function buildRoadmapView({ target, file }: BuildRoadmapViewInput): RoadmapView {
  const base = {
    kind: target.kind,
    slug: target.slug,
    path: target.path,
    startCondition: target.startCondition,
    done: target.done,
    total: target.total,
  };
  const parsed = file !== null && file.ok ? parseRoadmap(file.value) : null;
  const ids = parsed === null ? [] : [...new Set([...parsed.rows.map((row) => row.id), ...parsed.items.map((item) => item.id)])];
  if (parsed === null || ids.length === 0) {
    const fallback: RoadmapFallbackReason = file === null ? "not_configured" : file.ok ? "no_items" : file.kind;
    return {
      ...base,
      title: target.title ?? parsed?.title ?? target.slug,
      heading: null,
      status: target.status,
      version: null,
      updated: null,
      orders: parsed?.orders ?? [],
      items: target.stateItems.map(fromState),
      checks: [],
      fallback,
    };
  }
  const stateItems = new Map(target.stateItems.map((item) => [item.id, item]));
  const rows = new Map(parsed.rows.map((row) => [row.id, row]));
  const blocks = new Map(parsed.items.map((block) => [block.id, block]));
  const title = target.title ?? parsed.title ?? target.slug;
  return {
    ...base,
    title,
    heading: parsed.title !== null && parsed.title !== title ? parsed.title : null,
    status: parsed.frontmatter.status ?? target.status,
    version: parsed.frontmatter.version ?? null,
    updated: parsed.frontmatter.updated ?? null,
    orders: parsed.orders,
    items: ids.map((id) => fromFile(rows.get(id), blocks.get(id), stateItems.get(id), id)),
    checks: [...parsed.checks.filter((check) => !check.isDone), ...parsed.checks.filter((check) => check.isDone)],
    fallback: null,
  };
}
