// One read tool of COCKPIT's MCP endpoint over HTTP: the CLI's only way in, so it adds no endpoint of its own (FR-15).
import { fail, succeed, type Outcome } from "./outcome.ts";
import { z } from "zod";
import { en } from "../messages/en.ts";

export const MCP_PATH = "/api/mcp";
const PROTOCOL_VERSION = "2025-06-18";
const TIMEOUT_MS = 15_000;
const OPEN_MARKER = en.mcp.untrustedOpen;
const CLOSE_MARKER = en.mcp.untrustedClose;

export type CliFailure =
  | { readonly kind: "unreachable"; readonly reason: string }
  | { readonly kind: "unauthorized" }
  | { readonly kind: "http_status"; readonly status: number }
  | { readonly kind: "tool_error"; readonly message: string }
  | { readonly kind: "bad_answer" };

export interface CallToolOptions {
  /** COCKPIT's origin, already validated. */
  readonly url: URL;
  readonly token: string;
  readonly name: string;
  readonly args?: Readonly<Record<string, unknown>>;
  readonly fetch: typeof fetch;
}

const rpcAnswerSchema = z.object({
  result: z
    .object({
      content: z.array(z.object({ type: z.string(), text: z.string().optional() })),
      isError: z.boolean().optional(),
    })
    .optional(),
  error: z.object({ message: z.string() }).optional(),
});

/** The JSON-RPC message of an answer: plain JSON, or the data of the one SSE `message` event. */
function readMessage(body: string): unknown {
  const trimmed = body.trimStart();
  const json = trimmed.startsWith("{")
    ? trimmed
    : body
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim())
        .join("");
  try {
    return JSON.parse(json) as unknown;
  } catch {
    return null;
  }
}

/** The text between the first open marker and the last close marker, parsed as JSON. */
function readUntrustedJson(text: string): Outcome<unknown, CliFailure> {
  const start = text.indexOf(OPEN_MARKER);
  const end = text.lastIndexOf(CLOSE_MARKER);
  if (start === -1 || end <= start) {
    return fail({ kind: "bad_answer" });
  }
  try {
    return succeed(JSON.parse(text.slice(start + OPEN_MARKER.length, end)) as unknown);
  } catch {
    return fail({ kind: "bad_answer" });
  }
}

function describeFetchError(error: unknown): string {
  if (error instanceof Error) {
    const cause = error.cause instanceof Error ? error.cause.message : null;
    return error.name === "TimeoutError" ? `no answer within ${String(TIMEOUT_MS / 1000)} s` : (cause ?? error.message);
  }
  return String(error);
}

/** Calls one tool and returns its answer, the data between the untrusted-data markers. */
export async function callTool(options: CallToolOptions): Promise<Outcome<unknown, CliFailure>> {
  let response: Response;
  try {
    response = await options.fetch(new URL(MCP_PATH, options.url), {
      method: "POST",
      headers: {
        authorization: `Bearer ${options.token}`,
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        "mcp-protocol-version": PROTOCOL_VERSION,
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: options.name, arguments: options.args ?? {} } }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    return fail({ kind: "unreachable", reason: describeFetchError(error) });
  }
  if (response.status === 401 || response.status === 403) {
    return fail({ kind: "unauthorized" });
  }
  if (!response.ok) {
    return fail({ kind: "http_status", status: response.status });
  }
  const message = rpcAnswerSchema.safeParse(readMessage(await response.text()));
  if (!message.success) {
    return fail({ kind: "bad_answer" });
  }
  const { result, error } = message.data;
  if (error !== undefined) {
    return fail({ kind: "tool_error", message: error.message });
  }
  const text = result?.content.map((part) => part.text ?? "").join("\n") ?? "";
  if (result?.isError === true) {
    return fail({ kind: "tool_error", message: text });
  }
  return readUntrustedJson(text);
}
