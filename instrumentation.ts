import { createLogger } from "@softure-ai/observability";
import { createOnRequestError, registerObservability } from "@softure-ai/observability/next";

// Runs once at server start: importing the config registers it for package code. `next build` prerenders without
// it, so app/layout.tsx imports the config as well. Telemetry is exported only when OTEL_EXPORTER_OTLP_ENDPOINT is set.
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./softure.config.ts");
  }
  await registerObservability({ serviceName: "cockpit-web", serviceNamespace: "cockpit" });
}

export const onRequestError = createOnRequestError(createLogger("next"));
