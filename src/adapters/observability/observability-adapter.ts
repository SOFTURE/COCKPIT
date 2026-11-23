// The observability adapter as the scan runs it, with the backend from the environment: `GRAFANA_URL` and
// `GRAFANA_TOKEN` (a service account token that may read alert rules), the names `softure-observability grafana
// apply` uses. Unset, it reads nothing and no project shows health.
import type { FetchFunction } from "@softure-ai/core";
import type { ProjectAdapter } from "../contract.ts";
import type { GrafanaSource } from "./grafana-rules.ts";
import { OBSERVABILITY_ADAPTER_ID, type ProjectHealth } from "./project-health.ts";
import { readHealth } from "./read-health.ts";

export function getGrafanaSource(env: Readonly<Record<string, string | undefined>>, fetch?: FetchFunction): GrafanaSource | null {
  const url = env.GRAFANA_URL?.trim() ?? "";
  const token = env.GRAFANA_TOKEN?.trim() ?? "";
  if (url === "" || token === "") {
    return null;
  }
  return { url, token, fetch };
}

export function createObservabilityAdapter(grafana: GrafanaSource | null): ProjectAdapter<ProjectHealth> {
  return {
    id: OBSERVABILITY_ADAPTER_ID,
    read: (context) => readHealth({ ...context, grafana }),
  };
}
