// Drizzle view of the projects module: watched repositories and their groups, their latest reads, the owner's answers,
// broadcasts, routines and scheduled tasks.
import { bigint, boolean, integer, jsonb, pgSchema, text, timestamp, uuid } from "drizzle-orm/pg-core";

const projectsSchema = pgSchema("projects");

export const projectGroups = projectsSchema.table("project_groups", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  /** The lower-case forge owner whose repositories, added later, join this group. */
  defaultOwner: text("default_owner"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const repositories = projectsSchema.table("repositories", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  repositoryKey: text("repository_key").notNull().unique(),
  fullName: text("full_name").notNull(),
  defaultBranch: text("default_branch").notNull(),
  hasState: boolean("has_state").notNull(),
  missingPermissions: text("missing_permissions").array().notNull(),
  checkedAt: timestamp("checked_at", { withTimezone: true }).notNull(),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  groupId: bigint("group_id", { mode: "number" }).references(() => projectGroups.id, { onDelete: "set null" }),
});

export const reads = projectsSchema.table("reads", {
  repositoryKey: text("repository_key").primaryKey(),
  status: text("status").notNull(),
  issuesStatus: text("issues_status").notNull(),
  state: jsonb("state"),
  issues: jsonb("issues").notNull(),
  readAt: timestamp("read_at", { withTimezone: true }).notNull(),
  lastGoodAt: timestamp("last_good_at", { withTimezone: true }),
});

export const answers = projectsSchema.table("answers", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  repositoryKey: text("repository_key").notNull(),
  fullName: text("full_name").notNull(),
  entryId: text("entry_id").notNull(),
  entryText: text("entry_text").notNull(),
  entryKind: text("entry_kind").notNull(),
  entrySource: text("entry_source").notNull(),
  entryItem: text("entry_item"),
  answer: text("answer").notNull(),
  note: text("note"),
  answeredBy: text("answered_by").notNull(),
  answeredByName: text("answered_by_name"),
  answeredAt: timestamp("answered_at", { withTimezone: true }).notNull(),
  status: text("status").notNull(),
  issueNumber: integer("issue_number"),
  issueUrl: text("issue_url"),
});

export const broadcasts = projectsSchema.table("broadcasts", {
  id: uuid("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  sentBy: text("sent_by").notNull(),
  sentByName: text("sent_by_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const broadcastSends = projectsSchema.table("broadcast_sends", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  broadcastId: uuid("broadcast_id").notNull(),
  repositoryKey: text("repository_key").notNull(),
  fullName: text("full_name").notNull(),
  status: text("status").notNull(),
  failure: text("failure"),
  failureToken: text("failure_token"),
  issueNumber: integer("issue_number"),
  issueUrl: text("issue_url"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const routines = projectsSchema.table("routines", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  repositoryKey: text("repository_key").notNull(),
  name: text("name").notNull(),
  kind: text("kind").notNull(),
  provider: text("provider").notNull(),
  /** The provider's settings; read through its adapter, never trusted as stored. */
  settings: jsonb("settings").$type<unknown>().notNull(),
  tokenCiphertext: text("token_ciphertext").notNull(),
  tokenLast4: text("token_last4").notNull(),
  enabled: boolean("enabled").notNull(),
  lastFireOk: boolean("last_fire_ok"),
  lastFireStatus: integer("last_fire_status"),
  lastFireAt: timestamp("last_fire_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const routineFires = projectsSchema.table("routine_fires", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  repositoryKey: text("repository_key").notNull(),
  fullName: text("full_name").notNull(),
  issueNumber: integer("issue_number").notNull(),
  issueUrl: text("issue_url").notNull(),
  issueTitle: text("issue_title").notNull(),
  routineId: bigint("routine_id", { mode: "number" }),
  routineName: text("routine_name"),
  status: text("status").notNull(),
  httpStatus: integer("http_status"),
  reason: text("reason"),
  attempts: integer("attempts").notNull(),
  nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const fireLog = projectsSchema.table("fire_log", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  routineId: bigint("routine_id", { mode: "number" }).notNull(),
  firedAt: timestamp("fired_at", { withTimezone: true }).notNull(),
});

// Scheduled tasks (CT-36).
export const scheduledTasks = projectsSchema.table("scheduled_tasks", {
  id: uuid("id").primaryKey(),
  title: text("title").notNull(),
  prompt: text("prompt").notNull(),
  repositoryKeys: text("repository_keys").array().notNull(),
  runAt: timestamp("run_at", { withTimezone: true }).notNull(),
  status: text("status").notNull(),
  broadcastId: uuid("broadcast_id"),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  skippedKeys: text("skipped_keys").array().notNull(),
  failure: text("failure"),
  createdBy: text("created_by").notNull(),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});
