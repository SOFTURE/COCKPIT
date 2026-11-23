// The job worker inside the app's own server process, for stacks on a PGlite directory (`next dev`, the e2e): PGlite
// allows one instance per directory, so a second worker process cannot open it. Production runs `npm run worker`.
import { runJobWorker } from "@softure-ai/jobs/worker";
import config from "../../softure.config.ts";
import { getDatabase } from "../database.ts";
import { handlers } from "./handlers.ts";

export async function startInProcessWorker(): Promise<void> {
  const { db } = await getDatabase();
  const stop = new AbortController();
  process.once("SIGTERM", () => {
    stop.abort();
  });
  process.once("SIGINT", () => {
    stop.abort();
  });
  void runJobWorker({ db, config, handlers, signal: stop.signal, workerId: "app-process" }).catch((error: unknown) => {
    console.error("startInProcessWorker: the in-process job worker stopped", error instanceof Error ? error.name : "unknown");
  });
}
