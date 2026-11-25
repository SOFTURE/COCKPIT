// COCKPIT's MCP server: read tools over the overview, the inbox and one project (FR-13), and for a write token or
// grant one write tool that answers an entry through the inbox's rule (FR-14). Text from the watched repositories
// reaches the assistant between untrusted-data markers.
import type { McpServer } from "@modelcontextprotocol/server";
import {
  createMcpServerFactory,
  createUntrustedWrapper,
  withToolErrors,
  type McpBuildInfo,
  type VersionedMcpServerFactory,
} from "@softure-ai/mcp-access/server";
import { createLogger } from "@softure-ai/observability";
import { z } from "zod";
import { en } from "../../messages/en.ts";
import type { AppMessages } from "../../messages/index.ts";
import { createAnswerEntryInput, getAnswerErrorHints, toAnsweredValue, toEntryAnswerRequest, type EntryAnswerer } from "./answer-tool.ts";
import { toInboxAnswer, toOverviewAnswer, toProjectDetailAnswer } from "./answers.ts";
import type { CockpitReader } from "./cockpit-reader.ts";
import { MCP_SERVER_NAME, MCP_TOOL_NAMES } from "./tool-catalog.ts";

export interface CockpitServerOptions {
  readonly reader: CockpitReader;
  /** The inbox's rule with the database, the forge and the clock wired; called only for a token that can write. */
  readonly answer: EntryAnswerer;
  /** Adds `get_server_info` with the served tool contract; production passes the build info of ops. */
  readonly buildInfo?: () => McpBuildInfo | Promise<McpBuildInfo>;
  /** The app's copy in its locale; English by default. */
  readonly messages?: AppMessages;
}

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } as const;
// A repeat returns the first answer (idempotent); it writes to the forge (open world).
const ANSWER_HINTS = { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true } as const;

// The markers are a protocol, the same in every language (the Polish dictionary keeps them byte for byte).
export const untrustedText = createUntrustedWrapper({ open: en.mcp.untrustedOpen, close: en.mcp.untrustedClose });

type McpCopy = AppMessages["mcp"];

function getProjectHints(copy: McpCopy) {
  return { "mcp.project_invalid": copy.errors.projectInvalid, "mcp.project_unknown": copy.errors.projectUnknown };
}

const logger = createLogger("mcp");

type ToolErrorOptions = Parameters<typeof withToolErrors>[1];

function getErrorCode(value: unknown): string | null {
  if (typeof value === "object" && value !== null && "ok" in value && value.ok === false && "error" in value) {
    return typeof value.error === "string" ? value.error : "unknown";
  }
  return null;
}

/**
 * Runs one tool call through `withToolErrors` and logs it: the tool, the account, the outcome (the refusal's code) and
 * how long it took; never the arguments or the answer.
 */
export async function runLoggedTool(tool: string, userId: string, work: () => unknown, options?: ToolErrorOptions) {
  const startedAt = performance.now();
  let code: string | null = null;
  const result = await withToolErrors(async () => {
    const value: unknown = await work();
    code = getErrorCode(value);
    return value;
  }, options);
  const fields = { tool, user_id: userId, duration_ms: Math.round(performance.now() - startedAt) };
  if (result.isError !== true) {
    logger.info("mcp tool called", fields);
  } else if (code === null) {
    logger.error("mcp tool failed", fields);
  } else {
    logger.info("mcp tool refused", { ...fields, code });
  }
  return result;
}

/** The value as indented JSON between the untrusted-data markers. */
export function wrapAnswer(value: unknown): string {
  return untrustedText.wrap(JSON.stringify(value, null, 2));
}

function registerReadTools(server: McpServer, options: { reader: CockpitReader; userId: string; copy: McpCopy }): void {
  const { reader, userId, copy } = options;
  server.registerTool(
    MCP_TOOL_NAMES.overview,
    { title: copy.tools.getOverview.title, description: copy.tools.getOverview.description, annotations: READ_ONLY },
    () =>
      runLoggedTool(
        MCP_TOOL_NAMES.overview,
        userId,
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
    () =>
      runLoggedTool(MCP_TOOL_NAMES.inbox, userId, async () => wrapAnswer(toInboxAnswer(await reader.readInbox())), {
        label: MCP_TOOL_NAMES.inbox,
      }),
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
      runLoggedTool(
        MCP_TOOL_NAMES.project,
        userId,
        async () => {
          const inbox = await reader.readInbox();
          const detail = toProjectDetailAnswer(await reader.readOverview(inbox), inbox, project);
          return detail.ok ? { ok: true as const, value: wrapAnswer(detail.value) } : detail;
        },
        { label: MCP_TOOL_NAMES.project, hints: getProjectHints(copy) },
      ),
  );
}

function registerAnswerTool(server: McpServer, options: { reader: CockpitReader; answer: EntryAnswerer; userId: string; messages: AppMessages }): void {
  const { reader, answer, userId, messages } = options;
  const tool = messages.mcp.tools.answerEntry;
  server.registerTool(
    MCP_TOOL_NAMES.answerEntry,
    { title: tool.title, description: tool.description, inputSchema: createAnswerEntryInput(tool), annotations: ANSWER_HINTS },
    (input) =>
      runLoggedTool(
        MCP_TOOL_NAMES.answerEntry,
        userId,
        async () => {
          const request = toEntryAnswerRequest({ input, inbox: await reader.readInbox(), userId, defuse: untrustedText.defuse });
          if (!request.ok) {
            return request;
          }
          const sent = await answer(request.value);
          return sent.ok ? { ok: true as const, value: toAnsweredValue({ project: input.project.trim(), entryId: input.entry, sent: sent.value, copy: tool }) } : sent;
        },
        { label: MCP_TOOL_NAMES.answerEntry, hints: { ...getProjectHints(messages.mcp), ...getAnswerErrorHints(messages.inbox.errors) } },
      ),
  );
}

/** The factory the endpoint calls once per request: every token gets the read tools, a write token also the answer. */
export function createCockpitServerFactory(options: CockpitServerOptions): VersionedMcpServerFactory {
  const { reader, answer, buildInfo, messages = en } = options;
  const copy = messages.mcp;
  return createMcpServerFactory({
    name: MCP_SERVER_NAME,
    title: copy.serverTitle,
    serverOptions: { instructions: copy.instructions },
    strictToolInput: true,
    ...(buildInfo === undefined ? {} : { serverInfoTool: { buildInfo, tools: true } }),
    registerTools: (server, { userId, canWrite }) => {
      registerReadTools(server, { reader, userId, copy });
      if (canWrite) {
        registerAnswerTool(server, { reader, answer, userId, messages });
      }
    },
  });
}
