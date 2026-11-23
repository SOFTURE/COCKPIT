// Drizzle view of the watched repositories table.
import { bigint, boolean, pgSchema, text, timestamp } from "drizzle-orm/pg-core";

export const repositories = pgSchema("projects").table("repositories", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  repositoryKey: text("repository_key").notNull().unique(),
  fullName: text("full_name").notNull(),
  defaultBranch: text("default_branch").notNull(),
  hasState: boolean("has_state").notNull(),
  missingPermissions: text("missing_permissions").array().notNull(),
  checkedAt: timestamp("checked_at", { withTimezone: true }).notNull(),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
});
