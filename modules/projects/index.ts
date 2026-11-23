// COCKPIT's own module: the watched repositories, the latest scan read of each, the answers with who gave them, and
// the broadcasts.
import { defineModule, resolveMigrationsDir } from "@softure-ai/core";
import { checkProjects } from "./health.ts";

export const projects = defineModule({
  manifest: {
    id: "projects",
    version: "0.1.0",
    // Migration 0004 names existing answers from auth.users, so auth migrates first.
    dependsOn: { auth: "^0.2.20" },
    dbSchema: "projects",
    tables: ["repositories", "reads", "answers", "broadcasts", "broadcast_sends"],
    env: [],
    switches: [],
    routes: {},
    mount: [],
    privacy: { exports: false, deletes: false },
    runtimes: ["node"],
  },
  // The app's dictionaries in messages/ hold every text.
  messages: { en: {} },
  migrations: { dir: resolveMigrationsDir(import.meta.url, "./migrations/") },
  health: checkProjects,
});
