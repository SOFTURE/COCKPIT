// The operator shuts an open OAuth client registration window early:
// `softure-deploy run --host=<ssh alias> close-client-registration --commit`. Without --commit it only reports.
// The Dockerfile bundles this file into ops/close-client-registration.mjs.
import { createCloseClientRegistrationScript } from "@softure-ai/mcp-access/scripts";
import { runOpsScript } from "@softure-ai/ops/scripts";
import config from "../../softure.config.ts";

process.exitCode = await runOpsScript({ script: createCloseClientRegistrationScript(config), argv: process.argv.slice(2), config });
