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

/**
 * A fetch that stops calling once the backend could not be reached: the rest of the scan reports it unavailable at
 * once instead of waiting for a timeout per project (NFR-2). A backend that answers, even with an error, stays up.
 */
function stopAfterUnreachable(fetch: FetchFunction): FetchFunction {
  let isUnreachable = false;
  return async (input, init) => {
    if (isUnreachable) {
      throw new Error("observability backend unreachable earlier in this scan");
    }
    try {
      return await fetch(input, init);
    } catch (error) {
      isUnreachable = true;
      throw error;
    }
  };
}

/** One adapter per scan run: an unreachable backend is asked once per run. */
export function createObservabilityAdapter(grafana: GrafanaSource | null): ProjectAdapter<ProjectHealth> {
  const source = grafana === null ? null : { ...grafana, fetch: stopAfterUnreachable(grafana.fetch ?? globalThis.fetch) };
  return {
    id: OBSERVABILITY_ADAPTER_ID,
    read: (context) => readHealth({ ...context, grafana: source }),
  };
}
