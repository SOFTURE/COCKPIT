// COCKPIT's own module: the watched repositories and the latest scan read of each.
import { defineModule, resolveMigrationsDir } from "@softure-ai/core";
import { checkProjects } from "./health.ts";

export const projects = defineModule({
  manifest: {
    id: "projects",
    version: "0.1.0",
    dependsOn: {},
    dbSchema: "projects",
    tables: ["repositories", "reads"],
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
