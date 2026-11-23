// Drizzle view of the digest log.
import { bigint, jsonb, pgSchema, text, timestamp } from "drizzle-orm/pg-core";

const digestSchema = pgSchema("digest");

export const digests = digestSchema.table("digests", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  status: text("status").notNull(),
  snapshot: jsonb("snapshot").notNull(),
  subject: text("subject"),
  bodyText: text("body_text"),
  bodyHtml: text("body_html"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
});
