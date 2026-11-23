// The contract COCKPIT reads: a watched project's `context/state.json`, schema version 2
// (`@softure-ai/skills`, skills/softure-doctor/references/state.schema.json). Unknown keys are tolerated so a newer
// minor addition does not break the read; a missing required key or a wrong type is an invalid state.
import { err, ok, type Result } from "@softure-ai/core";
import { z } from "zod";

const nullableString = z.string().nullable();

const roadmapItemSchema = z.object({
  id: z.string(),
  change_id: nullableString,
  outcome: nullableString,
  status: z.string(),
  stage: nullableString,
  since: nullableString,
  detail: nullableString,
  prerequisites: z.array(z.string()),
  mode: nullableString,
});

const queuedRoadmapSchema = z.object({
  slug: z.string(),
  title: nullableString,
  status: nullableString,
  path: z.string(),
  start_condition: nullableString,
  done: z.number().int(),
  total: z.number().int(),
  items: z.array(z.object({ id: z.string(), change_id: nullableString, outcome: nullableString, status: z.string() })),
});

export const ownerQueueEntrySchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["word", "decision", "step", "secret"]),
  source: z.string(),
  item: nullableString,
  since: nullableString,
  text: z.string(),
});

export const projectStateSchema = z.object({
  schema_version: z.literal(2),
  project: z.string(),
  mode: z.enum(["manual", "autonomous"]),
  main_branch: nullableString,
  updated_at: z.string(),
  active_roadmap: z
    .object({
      slug: nullableString,
      title: nullableString,
      status: nullableString,
      version: nullableString,
      path: z.string(),
      done: z.number().int(),
      total: z.number().int(),
      items: z.array(roadmapItemSchema),
    })
    .nullable(),
  queued: z.array(queuedRoadmapSchema),
  open_changes: z.array(
    z.object({
      change_id: z.string(),
      title: nullableString,
      status: nullableString,
      roadmap_item: nullableString,
      updated: nullableString,
      stage: nullableString,
    }),
  ),
  owner_queue: z.array(ownerQueueEntrySchema),
  last_release: z.object({ version: z.string(), date: nullableString, source: z.string() }).nullable(),
});

export type ProjectState = z.infer<typeof projectStateSchema>;
export type OwnerQueueEntry = z.infer<typeof ownerQueueEntrySchema>;

export type StateReadError = "state.too_old" | "state.invalid";

/** Narrows a parsed `context/state.json` to version 2; version 1 is too old (no entry ids), anything else invalid. */
export function parseProjectState(value: unknown): Result<ProjectState, StateReadError> {
  if (typeof value === "object" && value !== null && "schema_version" in value && value.schema_version === 1) {
    return err("state.too_old");
  }
  const parsed = projectStateSchema.safeParse(value);
  return parsed.success ? ok(parsed.data) : err("state.invalid");
}
