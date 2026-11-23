// COCKPIT's MCP tools as the token page lists them; the server registers the same names (catalog parity test).
import type { McpToolDefinitionInput } from "@softure-ai/mcp-access";
import { en } from "../../messages/en.ts";

/** The name assistants list the server under. */
export const MCP_SERVER_NAME = "cockpit";

export const MCP_TOOL_NAMES = {
  overview: "get_overview",
  inbox: "get_inbox",
  project: "get_project",
} as const;

const tools = en.mcp.tools;

/** Read tools only: answering an entry over MCP comes with write access (CMP-15). */
export const MCP_TOOL_CATALOG: readonly McpToolDefinitionInput[] = [
  {
    name: MCP_TOOL_NAMES.overview,
    access: "read",
    title: { en: tools.getOverview.title },
    description: { en: tools.getOverview.description },
    example: { en: tools.getOverview.example },
  },
  {
    name: MCP_TOOL_NAMES.inbox,
    access: "read",
    title: { en: tools.getInbox.title },
    description: { en: tools.getInbox.description },
    example: { en: tools.getInbox.example },
  },
  {
    name: MCP_TOOL_NAMES.project,
    access: "read",
    title: { en: tools.getProject.title },
    description: { en: tools.getProject.description },
    example: { en: tools.getProject.example },
  },
];
