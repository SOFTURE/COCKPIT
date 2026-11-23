// Drizzle view of the watched repositories table.
import { bigint, boolean, jsonb, pgSchema, text, timestamp } from "drizzle-orm/pg-core";

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
