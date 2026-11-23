// Drizzle view of the forge facts table.
import { jsonb, pgSchema, text, timestamp } from "drizzle-orm/pg-core";

const overviewSchema = pgSchema("overview");

export const forgeFacts = overviewSchema.table("forge_facts", {
  repositoryKey: text("repository_key").primaryKey(),
  release: jsonb("release"),
  releaseStatus: text("release_status").notNull(),
  ciRun: jsonb("ci_run"),
  qualityReviewRun: jsonb("quality_review_run"),
  runsStatus: text("runs_status").notNull(),
  readAt: timestamp("read_at", { withTimezone: true }).notNull(),
});
