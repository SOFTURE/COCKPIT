// The production MCP server: the screens' own loaders and the build info of ops.
import "server-only";
import { readBuildInfo } from "@softure-ai/ops/server";
import { loadInbox } from "../inbox/load-inbox.ts";
import { loadOverview } from "../overview/load-overview.ts";
import { createCockpitServerFactory } from "./cockpit-server.ts";

export const createServer = createCockpitServerFactory({
  reader: { readInbox: loadInbox, readOverview: loadOverview },
  buildInfo: () => readBuildInfo(),
});
