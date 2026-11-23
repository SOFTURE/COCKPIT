// Drizzle view of the adapters module: the last read of each optional adapter per watched project.
import { jsonb, pgSchema, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

const adaptersSchema = pgSchema("adapters");

export const adapterReads = adaptersSchema.table(
  "reads",
  {
    repositoryKey: text("repository_key").notNull(),
    adapter: text("adapter").notNull(),
    status: text("status").notNull(),
    value: jsonb("value"),
    reason: text("reason"),
    readAt: timestamp("read_at", { withTimezone: true }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.repositoryKey, table.adapter] })],
);
