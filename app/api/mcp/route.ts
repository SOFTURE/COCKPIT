// COCKPIT over MCP (FR-13): a Bearer token or an OAuth grant; the server answers the overview, the inbox and a
// project's detail. Kept out of the session guard (proxy.ts): it authenticates by token. Every tool call is logged by
// the server (src/mcp/cockpit-server.ts); MCP_DIAGNOSTICS=1 adds one protocol line per request through the same logger.
import { createMcpRoute } from "@softure-ai/mcp-access/next";
import { createLogger } from "@softure-ai/observability";
import { createServer } from "../../../src/mcp/create-server.ts";

const logger = createLogger("mcp");

export const POST = createMcpRoute({
  createServer,
  diagnostics: process.env.MCP_DIAGNOSTICS === "1" ? (entry) => logger.info("mcp request", { ...entry }) : false,
});
