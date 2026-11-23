// COCKPIT over MCP (FR-13): a Bearer token or an OAuth grant; the server answers the overview, the inbox and a
// project's detail. Kept out of the session guard (proxy.ts): it authenticates by token.
import { createMcpRoute } from "@softure-ai/mcp-access/next";
import { createServer } from "../../../src/mcp/create-server.ts";

export const POST = createMcpRoute({ createServer, diagnostics: process.env.MCP_DIAGNOSTICS === "1" });
