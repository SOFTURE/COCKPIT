// Every job the worker runs: the scan (with the optional adapters), the queued routine fires, the scheduled tasks, the digest, and the prune jobs of the auth,
// security and mcp-access modules.
import { authJobHandlers } from "@softure-ai/auth/jobs";
import type { JobHandlers } from "@softure-ai/jobs";
import { mcpAccessJobHandlers } from "@softure-ai/mcp-access/jobs";
import { securityJobHandlers } from "@softure-ai/security/jobs";
import { createDeployAdapter } from "../adapters/deploy/deploy-adapter.ts";
import { createPackagesAdapter } from "../adapters/packages/packages-adapter.ts";
import { createObservabilityAdapter, getGrafanaSource } from "../adapters/observability/observability-adapter.ts";
import { createDigestHandler } from "../digest/digest-handler.ts";
import { DIGEST_QUEUE } from "../digest/digest-queue.ts";
import { getDigestSettings } from "../digest/digest-settings.ts";
import { getForgeClient } from "../projects/forge-access.ts";
import { createFireHandler } from "../routines/fire-handler.ts";
import { FIRE_QUEUE } from "../routines/fire-queue.ts";
import { getWakeDependencies } from "../routines/wake-access.ts";
import { getScheduledRunDependencies } from "../scheduled/scheduled-run-access.ts";
import { createScheduledTaskHandler } from "../scheduled/scheduled-task-handler.ts";
import { SCHEDULED_TASK_QUEUE } from "../scheduled/scheduled-task-queue.ts";
import { createScanHandler } from "../scan/scan-handler.ts";
import { SCAN_QUEUE } from "../scan/scan-queue.ts";

export const handlers: JobHandlers = {
  ...authJobHandlers,
  ...securityJobHandlers,
  ...mcpAccessJobHandlers,
  [SCAN_QUEUE]: createScanHandler(
    () => getForgeClient(),
    () => [createObservabilityAdapter(getGrafanaSource(process.env)), createDeployAdapter(), createPackagesAdapter(process.env)],
  ),
  [FIRE_QUEUE]: createFireHandler(() => getWakeDependencies()),
  [SCHEDULED_TASK_QUEUE]: createScheduledTaskHandler(() => getScheduledRunDependencies()),
  [DIGEST_QUEUE]: createDigestHandler(() => getDigestSettings(process.env)),
};
