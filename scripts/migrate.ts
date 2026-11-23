// Applies every pending migration of the enabled modules: `npm run migrate` (tsx), or bundled in the container.
import { runMigrateCli } from "@softure-ai/db/cli";
import config from "../softure.config.ts";

process.exitCode = await runMigrateCli({ config, argv: process.argv.slice(2) });
