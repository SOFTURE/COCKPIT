// The job worker: runs the scan schedule and the modules' prune jobs until SIGTERM (`npm run worker`, or
// `node worker.mjs` in the container). Its loop touches the health file after each round that reached the database;
// the compose file's health check runs `node worker.mjs --health`, which checks that file instead of starting a worker.
// Telemetry (logs, traces, metrics) is exported when OTEL_EXPORTER_OTLP_ENDPOINT is set; the jobs module's own lines
// (job started, succeeded, failed, scheduled runs) go through the same logger.
import { createLogger } from "@softure-ai/observability";
import { startObservability } from "@softure-ai/observability/node";
import { runJobWorkerProcess } from "@softure-ai/jobs/worker";
import config from "../softure.config.ts";
import { handlers } from "../src/jobs/handlers.ts";
import { getServiceIdentity } from "../src/observability/service.ts";

const isHealthCheck = process.argv.includes("--health");
// The health check is a short process of its own every few seconds: it exports nothing.
const observability = isHealthCheck
  ? null
  : startObservability({ ...getServiceIdentity("worker"), instrumentations: { host: false } });

await runJobWorkerProcess({ config, handlers, healthFile: "/tmp/softure-jobs-worker.alive", logger: createLogger("jobs") });
// The worker stopped (SIGTERM, or it could not start): send what is still buffered before the process ends.
await observability?.shutdown();
