// Every job the worker runs: the scan, the digest, and the prune jobs of the auth and security modules.
import { authJobHandlers } from "@softure-ai/auth/jobs";
import type { JobHandlers } from "@softure-ai/jobs";
import { securityJobHandlers } from "@softure-ai/security/jobs";
import { createDigestHandler } from "../digest/digest-handler.ts";
import { DIGEST_QUEUE } from "../digest/digest-queue.ts";
import { getDigestSettings } from "../digest/digest-settings.ts";
import { getForgeClient } from "../projects/forge-access.ts";
import { createScanHandler } from "../scan/scan-handler.ts";
import { SCAN_QUEUE } from "../scan/scan-queue.ts";

export const handlers: JobHandlers = {
  ...authJobHandlers,
  ...securityJobHandlers,
  [SCAN_QUEUE]: createScanHandler(() => getForgeClient()),
  [DIGEST_QUEUE]: createDigestHandler(() => getDigestSettings(process.env)),
};
