// The operator opens OAuth client registration for a few minutes, so the owner can add the connector in a hosted assistant:
// `softure-deploy run --host=<ssh alias> open-client-registration --minutes=15 --commit`. Without --commit it only reports.
// The Dockerfile bundles this file into ops/open-client-registration.mjs.
import { createOpenClientRegistrationScript } from "@softure-ai/mcp-access/scripts";
import { runOpsScript } from "@softure-ai/ops/scripts";
import config from "../../softure.config.ts";

process.exitCode = await runOpsScript({ script: createOpenClientRegistrationScript(config), argv: process.argv.slice(2), config });
