// COCKPIT's MCP server: read tools over the overview, the inbox and one project (FR-13). Text from the watched
// repositories reaches the assistant between untrusted-data markers. Writes come with CMP-15.
import type { McpServer } from "@modelcontextprotocol/server";
import {
  createMcpServerFactory,
  createUntrustedWrapper,
  withToolErrors,
  type McpBuildInfo,
  type VersionedMcpServerFactory,
} from "@softure-ai/mcp-access/server";
import { z } from "zod";
import { en } from "../../messages/en.ts";
import { toInboxAnswer, toOverviewAnswer, toProjectDetailAnswer } from "./answers.ts";
import type { CockpitReader } from "./cockpit-reader.ts";
import { MCP_SERVER_NAME, MCP_TOOL_NAMES } from "./tool-catalog.ts";

export interface CockpitServerOptions {
  readonly reader: CockpitReader;
  /** Adds `get_server_info` with the served tool contract; production passes the build info of ops. */
  readonly buildInfo?: () => McpBuildInfo | Promise<McpBuildInfo>;
}

const copy = en.mcp;
const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } as const;
const PROJECT_HINTS = { "mcp.project_invalid": copy.errors.projectInvalid, "mcp.project_unknown": copy.errors.projectUnknown };

export const untrustedText = createUntrustedWrapper({ open: copy.untrustedOpen, close: copy.untrustedClose });

/** The value as indented JSON between the untrusted-data markers. */
export function wrapAnswer(value: unknown): string {
  return untrustedText.wrap(JSON.stringify(value, null, 2));
}

function registerReadTools(server: McpServer, reader: CockpitReader): void {
  server.registerTool(
    MCP_TOOL_NAMES.overview,
    { title: copy.tools.getOverview.title, description: copy.tools.getOverview.description, annotations: READ_ONLY },
    () =>
      withToolErrors(
        async () => {
          const inbox = await reader.readInbox();
          return wrapAnswer(toOverviewAnswer(await reader.readOverview(inbox)));
        },
        { label: MCP_TOOL_NAMES.overview },
      ),
  );
  server.registerTool(
    MCP_TOOL_NAMES.inbox,
    { title: copy.tools.getInbox.title, description: copy.tools.getInbox.description, annotations: READ_ONLY },
    () => withToolErrors(async () => wrapAnswer(toInboxAnswer(await reader.readInbox())), { label: MCP_TOOL_NAMES.inbox }),
  );
  server.registerTool(
    MCP_TOOL_NAMES.project,
    {
      title: copy.tools.getProject.title,
      description: copy.tools.getProject.description,
      inputSchema: z.object({ project: z.string().min(1).max(200).describe(copy.tools.getProject.projectInput) }),
      annotations: READ_ONLY,
    },
    ({ project }) =>
      withToolErrors(
        async () => {
          const inbox = await reader.readInbox();
          const detail = toProjectDetailAnswer(await reader.readOverview(inbox), inbox, project);
          return detail.ok ? { ok: true as const, value: wrapAnswer(detail.value) } : detail;
        },
        { label: MCP_TOOL_NAMES.project, hints: PROJECT_HINTS },
      ),
  );
}

/** The factory the endpoint calls once per request; every token gets the same read tools. */
export function createCockpitServerFactory(options: CockpitServerOptions): VersionedMcpServerFactory {
  const { reader, buildInfo } = options;
  return createMcpServerFactory({
    name: MCP_SERVER_NAME,
    title: copy.serverTitle,
    serverOptions: { instructions: copy.instructions },
    strictToolInput: true,
    ...(buildInfo === undefined ? {} : { serverInfoTool: { buildInfo, tools: true } }),
    registerTools: (server) => {
      registerReadTools(server, reader);
    },
  });
}
