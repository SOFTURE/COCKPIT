import { createLogger } from "@softure-ai/observability";
import { createOnRequestError, registerObservability } from "@softure-ai/observability/next";
import { getServiceIdentity, UNTRACED_PATHS } from "./src/observability/service.ts";

// Runs once at server start: importing the config registers it for package code. `next build` prerenders without
// it, so app/layout.tsx imports the config as well. Telemetry is exported only when OTEL_EXPORTER_OTLP_ENDPOINT is set
// (src/observability/service.ts).
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./softure.config.ts");
    // Stacks on a PGlite directory run the job worker in this process (src/jobs/start-in-process-worker.ts).
    if (process.env.JOBS_IN_APP_PROCESS === "true") {
      const { startInProcessWorker } = await import("./src/jobs/start-in-process-worker.ts");
      await startInProcessWorker();
    }
  }
  await registerObservability({ ...getServiceIdentity("web"), traces: { ignorePaths: [...UNTRACED_PATHS] } });
}

export const onRequestError = createOnRequestError(createLogger("next"));
