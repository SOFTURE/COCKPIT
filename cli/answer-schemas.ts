// The read tools' answers as the CLI reads them: the shapes of src/mcp/answers.ts, narrowed at the boundary.
import { z } from "zod";
import { OWNER_WORD_ANSWERS } from "../src/inbox/owner-word-marker.ts";
import { ownerQueueEntrySchema } from "../src/state/state-schema.ts";
import { BROKEN_REASONS, PROJECT_STATUSES } from "../src/status/project-status.ts";

const runSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("run"),
    result: z.enum(["passed", "failed", "cancelled", "running"]),
    url: z.string(),
    at: z.string(),
    // A server older than CT-7 leaves it out.
    pullRequest: z.object({ number: z.number().int(), url: z.string() }).nullable().optional().transform((value) => value ?? null),
  }),
  z.object({ kind: z.literal("none") }),
  z.object({ kind: z.literal("not_readable") }),
  z.object({ kind: z.literal("not_read") }),
]);

const doctorSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("ok"), url: z.string().nullable() }),
  z.object({
    kind: z.literal("failing"),
    url: z.string().nullable(),
    codes: z.array(z.object({ code: z.string(), count: z.number() })).nullable(),
  }),
  z.object({ kind: z.literal("pending"), url: z.string().nullable() }),
  z.object({ kind: z.literal("missing") }),
  z.object({ kind: z.literal("not_readable") }),
  z.object({ kind: z.literal("not_read") }),
]);

const projectSchema = z.object({
  project: z.string(),
  status: z.enum(PROJECT_STATUSES),
  brokenReasons: z.array(z.enum(BROKEN_REASONS)),
  read: z.object({ status: z.string(), at: z.string().nullable() }),
  numbers: z
    .object({
      activeRoadmap: z.object({ slug: z.string().nullable(), title: z.string().nullable(), done: z.number(), total: z.number() }).nullable(),
      queued: z.number(),
      openChanges: z.number(),
      waiting: z.number(),
      unanswered: z.number(),
    })
    .nullable(),
  release: z.object({ version: z.string(), date: z.string().nullable(), source: z.enum(["release", "roadmap"]) }).nullable(),
  ci: runSchema,
  qualityReview: runSchema,
  doctor: doctorSchema,
});

const answerStateSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("open") }),
  z.object({ kind: z.literal("sending"), answer: z.enum(OWNER_WORD_ANSWERS) }),
  z.object({ kind: z.enum(["sent", "done"]), answer: z.enum(OWNER_WORD_ANSWERS), issueNumber: z.number(), issueUrl: z.string() }),
]);

const entrySchema = z.object({
  project: z.string(),
  id: z.string(),
  kind: ownerQueueEntrySchema.shape.kind,
  text: z.string(),
  item: z.string().nullable(),
  source: z.string(),
  since: z.string().nullable(),
  ageDays: z.number().nullable(),
  answer: answerStateSchema,
});

const historySchema = z.object({
  project: z.string(),
  text: z.string(),
  answer: z.enum(OWNER_WORD_ANSWERS),
  note: z.string().nullable(),
  answeredAt: z.string(),
  issueNumber: z.number(),
  issueUrl: z.string(),
  done: z.boolean(),
});

export const overviewAnswerSchema = z.object({
  projectCount: z.number(),
  groups: z.array(z.object({ status: z.enum(PROJECT_STATUSES), projects: z.array(projectSchema) })),
});

export const inboxAnswerSchema = z.object({
  unansweredCount: z.number(),
  entries: z.array(entrySchema),
  history: z.array(historySchema),
});

export const projectDetailAnswerSchema = z.object({ project: projectSchema, entries: z.array(entrySchema) });

export type ProjectAnswer = z.infer<typeof projectSchema>;
export type EntryAnswer = z.infer<typeof entrySchema>;
export type OverviewAnswer = z.infer<typeof overviewAnswerSchema>;
export type InboxAnswer = z.infer<typeof inboxAnswerSchema>;
export type ProjectDetailAnswer = z.infer<typeof projectDetailAnswerSchema>;
