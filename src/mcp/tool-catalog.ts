// COCKPIT's MCP tools as the token page lists them; the server registers the same names (catalog parity test).
import type { McpToolDefinitionInput } from "@softure-ai/mcp-access";
import { en } from "../../messages/en.ts";
import { pl } from "../../messages/pl.ts";

/** The name assistants list the server under. */
export const MCP_SERVER_NAME = "cockpit";

export const MCP_TOOL_NAMES = {
  overview: "get_overview",
  inbox: "get_inbox",
  project: "get_project",
  answerEntry: "answer_entry",
} as const;


type ToolCopyName = keyof typeof en.mcp.tools;
type ToolText = "title" | "description" | "example";

/** One text of a tool in every language COCKPIT speaks; the token page and the server pick the app's locale. */
function localize(tool: ToolCopyName, text: ToolText): { en: string; pl: string } {
  return { en: en.mcp.tools[tool][text], pl: pl.mcp.tools[tool][text] };
}

/** Three read tools for every token; answering an entry needs write access (FR-14). */
export const MCP_TOOL_CATALOG: readonly McpToolDefinitionInput[] = [
  {
    name: MCP_TOOL_NAMES.overview,
    access: "read",
    title: localize("getOverview", "title"),
    description: localize("getOverview", "description"),
    example: localize("getOverview", "example"),
  },
  {
    name: MCP_TOOL_NAMES.inbox,
    access: "read",
    title: localize("getInbox", "title"),
    description: localize("getInbox", "description"),
    example: localize("getInbox", "example"),
  },
  {
    name: MCP_TOOL_NAMES.project,
    access: "read",
    title: localize("getProject", "title"),
    description: localize("getProject", "description"),
    example: localize("getProject", "example"),
  },
  {
    name: MCP_TOOL_NAMES.answerEntry,
    access: "write",
    title: localize("answerEntry", "title"),
    description: localize("answerEntry", "description"),
    example: localize("answerEntry", "example"),
  },
];
