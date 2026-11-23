// The job worker: runs the scan schedule and the modules' prune jobs until SIGTERM (`npm run worker`, or
// `node worker.mjs` in the container). Its loop touches the health file after each round that reached the database;
// the compose file's health check runs `node worker.mjs --health`, which checks that file instead of starting a worker.
import { runJobWorkerProcess } from "@softure-ai/jobs/worker";
import config from "../softure.config.ts";
import { handlers } from "../src/jobs/handlers.ts";

await runJobWorkerProcess({ config, handlers, healthFile: "/tmp/softure-jobs-worker.alive" });
