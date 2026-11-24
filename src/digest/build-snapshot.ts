// What a digest compares (FR-12): per watched project, its done roadmap items, its release, its open entries and
// why it is broken, computed with the same builders the inbox and the overview use, so the mail and the screens agree.
import { z } from "zod";
import type { StoredAdapterRead } from "../../modules/adapters/reads.ts";
import type { StoredForgeFacts } from "../../modules/overview/facts.ts";
import type { ProjectRead } from "../../modules/projects/reads.ts";
import { buildInbox, type InboxAnswer } from "../inbox/build-inbox.ts";
import { buildOverview, countUnansweredByProject } from "../overview/build-overview.ts";
import { BROKEN_REASONS, type BrokenReason } from "../status/project-status.ts";

const brokenReasonSchema = z.enum(BROKEN_REASONS);

const projectSnapshotSchema = z.object({
  name: z.string(),
  doneItems: z.array(z.object({ id: z.string(), outcome: z.string().nullable() })),
  release: z.string().nullable(),
  openEntries: z.array(z.object({ id: z.string(), text: z.string() })),
  brokenReasons: z.array(brokenReasonSchema),
});

export const digestSnapshotSchema = z.object({ projects: z.record(z.string(), projectSnapshotSchema) });

export type ProjectSnapshot = z.infer<typeof projectSnapshotSchema>;
export type DigestSnapshot = z.infer<typeof digestSnapshotSchema>;

export interface BuildSnapshotInput {
  readonly projects: readonly { readonly key: string; readonly fullName: string }[];
  readonly reads: readonly ProjectRead[];
  readonly facts: readonly StoredForgeFacts[];
  /** What the optional adapters stored (health); a project broken by its health is broken in the mail too. */
  readonly adapterReads?: readonly StoredAdapterRead[];
  readonly answers: readonly InboxAnswer[];
  readonly now: Date;
  readonly timeZone: string;
}

const storedItemsSchema = z.object({
  active_roadmap: z
    .object({ items: z.array(z.object({ id: z.string(), outcome: z.string().nullable(), status: z.string() })) })
    .nullable(),
});

function getDoneItems(state: unknown): ProjectSnapshot["doneItems"] {
  const parsed = storedItemsSchema.safeParse(state);
  if (!parsed.success || parsed.data.active_roadmap === null) {
    return [];
  }
  // `done` and `done_code (…)` both mean the item's code is on the main branch.
  return parsed.data.active_roadmap.items.filter((item) => item.status.startsWith("done")).map((item) => ({ id: item.id, outcome: item.outcome }));
}

export function buildSnapshot(input: BuildSnapshotInput): DigestSnapshot {
  const readsByKey = new Map(input.reads.map((read) => [read.key, read]));
  const inbox = buildInbox(
    input.projects.flatMap((project) => {
      const read = readsByKey.get(project.key);
      return read === undefined ? [] : [{ key: project.key, fullName: project.fullName, state: read.state, issues: read.issues }];
    }),
    input.now,
    input.timeZone,
    input.answers,
  );
  const overview = buildOverview({
    projects: input.projects,
    reads: input.reads,
    facts: input.facts,
    adapterReads: input.adapterReads,
    unansweredByKey: countUnansweredByProject(inbox.rows),
    now: input.now,
  });
  const rowsByKey = new Map(overview.groups.flatMap((group) => group.rows).map((row) => [row.key, row]));
  const projects: Record<string, ProjectSnapshot> = {};
  for (const project of input.projects) {
    const row = rowsByKey.get(project.key);
    projects[project.key] = {
      name: project.fullName,
      doneItems: getDoneItems(readsByKey.get(project.key)?.state),
      release: row?.release?.version ?? null,
      openEntries: inbox.rows
        .filter((inboxRow) => inboxRow.projectKey === project.key && inboxRow.answer.kind === "open")
        .map((inboxRow) => ({ id: inboxRow.entry.id, text: inboxRow.entry.text })),
      brokenReasons: [...(row?.brokenReasons ?? [])] as BrokenReason[],
    };
  }
  return { projects };
}

/** A stored snapshot, or null when it is not one (an older shape is treated as no previous digest). */
export function parseSnapshot(value: unknown): DigestSnapshot | null {
  const parsed = digestSnapshotSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
