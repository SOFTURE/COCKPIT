// The job worker: runs the scan schedule and the modules' prune jobs until SIGTERM (`npm run worker`).
import { runJobWorkerProcess } from "@softure-ai/jobs/worker";
import config from "../softure.config.ts";
import { handlers } from "../src/jobs/handlers.ts";

await runJobWorkerProcess({ config, handlers });
