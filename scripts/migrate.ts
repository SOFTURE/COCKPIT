// Applies every pending migration of the enabled modules: `npm run migrate` (tsx), or bundled in the container.
// A one-shot process: with OTEL_EXPORTER_OTLP_ENDPOINT set it exports its logs and traces (no metrics) and flushes
// them when it ends on its own.
import { createLogger } from "@softure-ai/observability";
import { startObservability } from "@softure-ai/observability/node";
import { runMigrateCli } from "@softure-ai/db/cli";
import config from "../softure.config.ts";
import { getServiceIdentity } from "../src/observability/service.ts";
import { ensurePgliteParent } from "./pglite-directory.ts";

startObservability({ ...getServiceIdentity("migrate"), lifetime: "short" });
const logger = createLogger("migrate");

await ensurePgliteParent(config.database?.url ?? "");
const exitCode = await runMigrateCli({ config, argv: process.argv.slice(2) });
if (exitCode === 0) {
  logger.info("migrations applied");
} else {
  logger.error("migrations failed", { exit_code: exitCode });
}
process.exitCode = exitCode;
