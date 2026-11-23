// The production MCP server: the screens' own loaders, the inbox's answer rule and the build info of ops.
import "server-only";
import { systemClock } from "@softure-ai/core";
import { readBuildInfo } from "@softure-ai/ops/server";
import { getDatabase } from "../database.ts";
import { answerEntry } from "../decisions/answer-entry.ts";
import { loadInbox } from "../inbox/load-inbox.ts";
import { loadOverview } from "../overview/load-overview.ts";
import { getForgeClient } from "../projects/forge-access.ts";
import { createCockpitServerFactory } from "./cockpit-server.ts";

export const createServer = createCockpitServerFactory({
  reader: { readInbox: loadInbox, readOverview: loadOverview },
  answer: async (request) => {
    const { db } = await getDatabase();
    return answerEntry({ ...request, db, client: getForgeClient(), clock: systemClock });
  },
  buildInfo: () => readBuildInfo(),
});
