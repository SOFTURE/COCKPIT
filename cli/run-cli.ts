// The `cockpit` command: parses the arguments, calls one read tool and prints its answer as tables or JSON (FR-15).
import { fail, succeed, type Outcome } from "./outcome.ts";
import type { z } from "zod";
import { en } from "../messages/en.ts";
import { fillMessage } from "../messages/index.ts";
import { MCP_TOOL_NAMES } from "../src/mcp/tool-catalog.ts";
import { createTimeFormatter } from "../src/projects/format-time.ts";
import { inboxAnswerSchema, overviewAnswerSchema, projectDetailAnswerSchema } from "./answer-schemas.ts";
import { callTool, type CliFailure } from "./call-tool.ts";
import { renderInbox, renderOverview, renderProject, type FormatTime } from "./render-views.ts";

const copy = en.cli;

export const EXIT_OK = 0;
export const EXIT_FAILURE = 1;
export const EXIT_USAGE = 2;

export interface CliIo {
  readonly env: Readonly<Record<string, string | undefined>>;
  readonly fetch: typeof fetch;
  readonly stdout: (text: string) => void;
  readonly stderr: (text: string) => void;
  /** Formats times as the screens do; the terminal's own time zone by default. */
  readonly formatTime?: FormatTime;
}

type Command = { readonly kind: "overview" } | { readonly kind: "inbox" } | { readonly kind: "project"; readonly project: string } | { readonly kind: "help" };

interface Invocation {
  readonly command: Command;
  readonly json: boolean;
  readonly url: string | undefined;
}

function parseArguments(argv: readonly string[]): Outcome<Invocation, string> {
  const positionals: string[] = [];
  let json = false;
  let help = false;
  let url: string | undefined;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index] ?? "";
    if (arg === "--json") {
      json = true;
    } else if (arg === "--help" || arg === "-h") {
      help = true;
    } else if (arg === "--url") {
      index += 1;
      url = argv[index] ?? "";
    } else if (arg.startsWith("--url=")) {
      url = arg.slice("--url=".length);
    } else if (arg.startsWith("-")) {
      return fail(fillMessage(copy.errors.unknownOption, { option: arg }));
    } else {
      positionals.push(arg);
    }
  }
  if (help) {
    return succeed({ command: { kind: "help" }, json, url });
  }
  const [name, project, ...rest] = positionals;
  if (name === undefined) {
    return fail(copy.errors.missingCommand);
  }
  if (name === "overview" || name === "inbox") {
    return project === undefined ? succeed({ command: { kind: name }, json, url }) : fail(fillMessage(copy.errors.unknownCommand, { command: `${name} ${project}` }));
  }
  if (name === "project") {
    return project === undefined || rest.length > 0 ? fail(copy.errors.missingProject) : succeed({ command: { kind: "project", project }, json, url });
  }
  return fail(fillMessage(copy.errors.unknownCommand, { command: name }));
}

function parseOrigin(value: string): Outcome<URL, string> {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? succeed(url) : fail(fillMessage(copy.errors.invalidUrl, { url: value }));
  } catch {
    return fail(fillMessage(copy.errors.invalidUrl, { url: value }));
  }
}

function describeFailure(failure: CliFailure, url: URL, tool: string): string {
  const origin = url.origin;
  switch (failure.kind) {
    case "unreachable":
      return fillMessage(copy.errors.unreachable, { url: origin, reason: failure.reason });
    case "unauthorized":
      return fillMessage(copy.errors.unauthorized, { url: origin });
    case "http_status":
      return fillMessage(copy.errors.httpStatus, { url: origin, status: failure.status, tool });
    case "tool_error":
      return fillMessage(copy.errors.toolError, { tool, message: failure.message });
    case "bad_answer":
      return fillMessage(copy.errors.badAnswer, { url: origin, tool });
  }
}

interface View<T> {
  readonly tool: string;
  readonly args: Readonly<Record<string, unknown>>;
  readonly schema: z.ZodType<T>;
  readonly render: (answer: T, formatTime: FormatTime) => string;
}

async function printView<T>(view: View<T>, invocation: { readonly url: URL; readonly token: string; readonly json: boolean }, io: CliIo): Promise<number> {
  const answer = await callTool({ url: invocation.url, token: invocation.token, name: view.tool, args: view.args, fetch: io.fetch });
  if (!answer.ok) {
    io.stderr(describeFailure(answer.error, invocation.url, view.tool));
    return EXIT_FAILURE;
  }
  const parsed = view.schema.safeParse(answer.value);
  if (!parsed.success) {
    io.stderr(describeFailure({ kind: "bad_answer" }, invocation.url, view.tool));
    return EXIT_FAILURE;
  }
  const formatTime = io.formatTime ?? createTimeFormatter("en", Intl.DateTimeFormat().resolvedOptions().timeZone);
  io.stdout(invocation.json ? JSON.stringify(parsed.data, null, 2) : view.render(parsed.data, formatTime));
  return EXIT_OK;
}

function printCommand(command: Exclude<Command, { kind: "help" }>, invocation: { readonly url: URL; readonly token: string; readonly json: boolean }, io: CliIo): Promise<number> {
  switch (command.kind) {
    case "overview":
      return printView({ tool: MCP_TOOL_NAMES.overview, args: {}, schema: overviewAnswerSchema, render: renderOverview }, invocation, io);
    case "inbox":
      return printView({ tool: MCP_TOOL_NAMES.inbox, args: {}, schema: inboxAnswerSchema, render: renderInbox }, invocation, io);
    case "project":
      return printView({ tool: MCP_TOOL_NAMES.project, args: { project: command.project }, schema: projectDetailAnswerSchema, render: renderProject }, invocation, io);
  }
}

/** Runs one invocation and returns the exit code: 0 printed, 1 COCKPIT failed or refused, 2 wrong usage. */
export async function runCli(argv: readonly string[], io: CliIo): Promise<number> {
  const invocation = parseArguments(argv);
  if (!invocation.ok) {
    io.stderr(invocation.error);
    return EXIT_USAGE;
  }
  const { command, json } = invocation.value;
  if (command.kind === "help") {
    io.stdout(copy.usage);
    return EXIT_OK;
  }
  const rawUrl = invocation.value.url ?? io.env.COCKPIT_URL;
  if (rawUrl === undefined || rawUrl.trim() === "") {
    io.stderr(copy.errors.missingUrl);
    return EXIT_USAGE;
  }
  const url = parseOrigin(rawUrl.trim());
  if (!url.ok) {
    io.stderr(url.error);
    return EXIT_USAGE;
  }
  const token = io.env.COCKPIT_TOKEN?.trim() ?? "";
  if (token === "") {
    io.stderr(copy.errors.missingToken);
    return EXIT_USAGE;
  }
  return printCommand(command, { url: url.value, token, json }, io);
}
