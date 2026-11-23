// Drizzle view of the projects module: watched repositories, their latest reads and the owner's answers.
import { bigint, boolean, integer, jsonb, pgSchema, text, timestamp } from "drizzle-orm/pg-core";

const projectsSchema = pgSchema("projects");

export const repositories = projectsSchema.table("repositories", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  repositoryKey: text("repository_key").notNull().unique(),
  fullName: text("full_name").notNull(),
  defaultBranch: text("default_branch").notNull(),
  hasState: boolean("has_state").notNull(),
  missingPermissions: text("missing_permissions").array().notNull(),
  checkedAt: timestamp("checked_at", { withTimezone: true }).notNull(),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
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
  answeredAt: timestamp("answered_at", { withTimezone: true }).notNull(),
  status: text("status").notNull(),
  issueNumber: integer("issue_number"),
  issueUrl: text("issue_url"),
});
