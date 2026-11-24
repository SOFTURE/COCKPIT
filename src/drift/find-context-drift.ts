// Context drift against the forge (CT-3): a project whose forge published a release after the roadmap rows its
// `context/state.json` still shows as `waiting: release` (nobody ran `wt-roadmap.py released <tag>`), or whose active
// roadmap has every row done and is still live instead of closed. Read from what the scan already stored: the state
// and the forge's latest release, both narrowed here because stored JSON is read defensively.
import { z } from "zod";

export type ContextDrift =
  | {
      readonly kind: "release_not_settled";
      readonly version: string;
      /** `YYYY-MM-DD` the release was published. */
      readonly date: string;
      /** The roadmap rows merged before that release and still waiting for one. */
      readonly items: readonly string[];
    }
  | { readonly kind: "finished_roadmap_live"; readonly slug: string | null; readonly total: number };

export interface FindContextDriftInput {
  /** The stored `context/state.json`; anything that is not one finds no drift. */
  readonly state: unknown;
  /** The stored latest release (`{ version, date }`) or null when the forge has none. */
  readonly release: unknown;
}

const driftStateSchema = z.object({
  active_roadmap: z
    .object({
      slug: z.string().nullable(),
      items: z.array(z.object({ id: z.string(), status: z.string(), since: z.string().nullable(), detail: z.string().nullable() })),
    })
    .nullable(),
  owner_queue: z.array(z.object({ kind: z.string(), since: z.string().nullable(), text: z.string() })),
});
type DriftState = z.infer<typeof driftStateSchema>;
type DriftItem = NonNullable<DriftState["active_roadmap"]>["items"][number];

const releaseSchema = z.object({ version: z.string(), date: z.string().nullable() });

/** Statuses that close a row; a roadmap is finished when every row has one and at least one is `done`. */
const CLOSED_STATUSES: ReadonlySet<string> = new Set(["done", "dropped", "carried"]);
const RELEASE_WORD_PREFIX = "release:";
const DATE_PREFIX = /^\d{4}-\d{2}-\d{2};\s*/;
const WAITING_PREFIX = /^waiting:\s*/i;

/** A `done_code` row whose waiting part names a release, as `@softure-ai/skills` (context_state.py) reads it. */
function isWaitingForRelease(item: DriftItem): boolean {
  if (item.status !== "done_code" || item.detail === null) {
    return false;
  }
  const waiting = item.detail.replace(DATE_PREFIX, "").replace(WAITING_PREFIX, "");
  return waiting.toLowerCase().includes("release");
}

/** The date of the owner queue's `release:` word, which dates rows written without a date of their own. */
function getReleaseWordSince(state: DriftState): string | null {
  return state.owner_queue.find((entry) => entry.kind === "word" && entry.text.startsWith(RELEASE_WORD_PREFIX))?.since ?? null;
}

function findUnsettledRelease(state: DriftState, release: z.infer<typeof releaseSchema> | null): ContextDrift | null {
  if (state.active_roadmap === null || release === null || release.date === null) {
    return null;
  }
  const releaseDate = release.date;
  const fallbackSince = getReleaseWordSince(state);
  // Both dates are day-precise: a release on the merge day may predate the merge, so only a later day counts.
  const items = state.active_roadmap.items
    .filter(isWaitingForRelease)
    .filter((item) => {
      const since = item.since ?? fallbackSince;
      return since !== null && releaseDate.slice(0, 10) > since.slice(0, 10);
    })
    .map((item) => item.id);
  return items.length === 0 ? null : { kind: "release_not_settled", version: release.version, date: releaseDate, items };
}

function findFinishedRoadmap(state: DriftState): ContextDrift | null {
  const roadmap = state.active_roadmap;
  if (roadmap === null) {
    return null;
  }
  const isFinished = roadmap.items.every((item) => CLOSED_STATUSES.has(item.status)) && roadmap.items.some((item) => item.status === "done");
  return isFinished ? { kind: "finished_roadmap_live", slug: roadmap.slug, total: roadmap.items.length } : null;
}

/** Every drift of one project's context against its forge, release first; empty when the context is settled. */
export function findContextDrift({ state, release }: FindContextDriftInput): ContextDrift[] {
  const parsedState = driftStateSchema.safeParse(state);
  if (!parsedState.success) {
    return [];
  }
  const parsedRelease = releaseSchema.safeParse(release);
  return [findUnsettledRelease(parsedState.data, parsedRelease.success ? parsedRelease.data : null), findFinishedRoadmap(parsedState.data)].filter(
    (drift): drift is ContextDrift => drift !== null,
  );
}
