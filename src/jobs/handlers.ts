// Every job the worker runs: the scan (with the optional adapters and the wake-up read), the digest, and the prune jobs of the auth,
// security and mcp-access modules.
import { authJobHandlers } from "@softure-ai/auth/jobs";
import type { JobHandlers } from "@softure-ai/jobs";
import { mcpAccessJobHandlers } from "@softure-ai/mcp-access/jobs";
import { securityJobHandlers } from "@softure-ai/security/jobs";
import { createDeployAdapter } from "../adapters/deploy/deploy-adapter.ts";
import { createPackagesAdapter } from "../adapters/packages/packages-adapter.ts";
import { createWakeAdapter } from "../adapters/wake/wake-adapter.ts";
import { createObservabilityAdapter, getGrafanaSource } from "../adapters/observability/observability-adapter.ts";
import { createDigestHandler } from "../digest/digest-handler.ts";
import { DIGEST_QUEUE } from "../digest/digest-queue.ts";
import { getDigestSettings } from "../digest/digest-settings.ts";
import { getForgeClient } from "../projects/forge-access.ts";
import { createScanHandler } from "../scan/scan-handler.ts";
import { SCAN_QUEUE } from "../scan/scan-queue.ts";

export const handlers: JobHandlers = {
  ...authJobHandlers,
  ...securityJobHandlers,
  ...mcpAccessJobHandlers,
  [SCAN_QUEUE]: createScanHandler(
    () => getForgeClient(),
    () => [createObservabilityAdapter(getGrafanaSource(process.env)), createDeployAdapter(), createWakeAdapter(), createPackagesAdapter(process.env)],
  ),
  [DIGEST_QUEUE]: createDigestHandler(() => getDigestSettings(process.env)),
};
