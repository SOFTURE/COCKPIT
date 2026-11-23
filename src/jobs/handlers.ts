// Every job the worker runs: the scan (with the optional adapters), and the prune jobs of the auth and security modules.
import { authJobHandlers } from "@softure-ai/auth/jobs";
import type { JobHandlers } from "@softure-ai/jobs";
import { securityJobHandlers } from "@softure-ai/security/jobs";
import { createObservabilityAdapter, getGrafanaSource } from "../adapters/observability/observability-adapter.ts";
import { getForgeClient } from "../projects/forge-access.ts";
import { createScanHandler } from "../scan/scan-handler.ts";
import { SCAN_QUEUE } from "../scan/scan-queue.ts";

export const handlers: JobHandlers = {
  ...authJobHandlers,
  ...securityJobHandlers,
  [SCAN_QUEUE]: createScanHandler(
    () => getForgeClient(),
    () => [createObservabilityAdapter(getGrafanaSource(process.env))],
  ),
};
