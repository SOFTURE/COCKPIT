import { getAuthOptions } from "@softure-ai/auth/server";
import { createTestAccount } from "@softure-ai/auth/testing";
import { createMcpEndpoint, issueAccessToken, revokeAccessToken } from "@softure-ai/mcp-access/server";
import { expectToolCatalogMatchesServer, measureServedToolLists } from "@softure-ai/mcp-access/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import config from "../../softure.config.ts";
import { createCockpitServerFactory, untrustedText } from "../../src/mcp/cockpit-server.ts";
import { MCP_TOOL_NAMES } from "../../src/mcp/tool-catalog.ts";
import { createTestContext, type TestContext } from "../support/test-context.ts";
import { FIXTURE_READER, HOSTILE_TEXT } from "./cockpit-fixture.ts";

const createServer = createCockpitServerFactory({ reader: FIXTURE_READER });
const endpoint = createMcpEndpoint({ createServer });

let requestId = 0;

function rpc(token: string | null, method: string, params: Record<string, unknown> = {}): Request {
  requestId += 1;
  return new Request("http://localhost:3000/api/mcp", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      "mcp-protocol-version": "2025-06-18",
      "cf-connecting-ip": "198.18.0.7",
      ...(token === null ? {} : { authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: requestId, method, params }),
  });
}

/** The JSON-RPC result of an answer, plain JSON or one SSE `message` event. */
async function readResult(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text();
  const json = text.startsWith("{") ? text : (text.split("\n").find((line) => line.startsWith("data:")) ?? "").slice(5);
  const message = JSON.parse(json) as { result?: Record<string, unknown>; error?: unknown };
  if (message.result === undefined) {
    throw new Error(`readResult: no result in ${text}`);
  }
  return message.result;
}

/** The tool's text between the markers, parsed. */
function readAnswer(result: Record<string, unknown>): unknown {
  const [content] = result.content as { type: string; text: string }[];
  const text = content?.text ?? "";
  expect(text.startsWith(`${untrustedText.open}\n`)).toBe(true);
  expect(text.endsWith(`\n${untrustedText.close}`)).toBe(true);
  return JSON.parse(text.slice(untrustedText.open.length + 1, -(untrustedText.close.length + 1)));
}

describe("the MCP server", () => {
  let ctx: TestContext;
  let userId: string;
  let token: string;

  beforeEach(async () => {
    ctx = await createTestContext();
    const account = await createTestAccount(ctx.database.db, {
      email: "owner@example.com",
      // The password changed before the token was issued, or the token counts as ended (on the test clock).
      createdAt: new Date(ctx.clock.now().getTime() - 60_000),
      password: "correct horse battery staple",
      scrypt: getAuthOptions(config).password.scrypt,
    });
    userId = account.id;
    const issued = await issueAccessToken(ctx, { userId, name: "Assistant", canWrite: false });
    if (!issued.ok) throw new Error(issued.error);
    token = issued.value.token;
  });

  afterEach(async () => {
    await ctx.database.close();
  });

  it("lists the same tools as the token page's catalog, and none that answers an entry", async () => {
    await expectToolCatalogMatchesServer(config, createServer);
    const lists = await measureServedToolLists(createServer);
    expect({ read: lists.read.toolCount, write: lists.write.toolCount }).toEqual({ read: 3, write: 3 });
  });

  it("lists only the three read tools to a read token", async () => {
    const result = await readResult(await endpoint(ctx, rpc(token, "tools/list")));
    const tools = result.tools as { name: string; annotations?: { readOnlyHint?: boolean } }[];
    expect(tools.map((tool) => tool.name).sort()).toEqual(["get_inbox", "get_overview", "get_project"]);
    expect(tools.every((tool) => tool.annotations?.readOnlyHint === true)).toBe(true);
  });

  it("answers the fixture overview, inbox and project between the untrusted-data markers", async () => {
    const overview = readAnswer(await readResult(await endpoint(ctx, rpc(token, "tools/call", { name: MCP_TOOL_NAMES.overview, arguments: {} }))));
    const { projectCount, groups } = overview as { projectCount: number; groups: { status: string; projects: { project: string }[] }[] };
    expect(projectCount).toBe(2);
    expect(groups[0]).toMatchObject({ status: "waiting", projects: [{ project: "example-org/alpha-app" }] });

    const inbox = readAnswer(await readResult(await endpoint(ctx, rpc(token, "tools/call", { name: MCP_TOOL_NAMES.inbox, arguments: {} }))));
    expect(inbox).toMatchObject({ unansweredCount: 2, entries: [{ id: "oq-1a2b3c" }, { id: "oq-4d5e6f", text: "Add the mail key" }] });

    const project = readAnswer(
      await readResult(await endpoint(ctx, rpc(token, "tools/call", { name: MCP_TOOL_NAMES.project, arguments: { project: "example-org/alpha-app" } }))),
    );
    expect(project).toMatchObject({ project: { project: "example-org/alpha-app", status: "waiting" }, entries: [{ id: "oq-1a2b3c" }, { id: "oq-4d5e6f" }] });
  });

  it("defuses a marker inside repository text so it cannot close the block early", async () => {
    const result = await readResult(await endpoint(ctx, rpc(token, "tools/call", { name: MCP_TOOL_NAMES.inbox, arguments: {} })));
    const [content] = result.content as { text: string }[];
    expect(content?.text.split(untrustedText.close)).toHaveLength(2);
    const inbox = readAnswer(result) as { entries: { text: string }[] };
    expect(inbox.entries[0]?.text).not.toBe(HOSTILE_TEXT);
    expect(inbox.entries[0]?.text.replace(/‍/g, "")).toBe(HOSTILE_TEXT);
  });

  it("answers an unknown project and an unknown field with a tool error, never a stack", async () => {
    const unknown = await readResult(await endpoint(ctx, rpc(token, "tools/call", { name: MCP_TOOL_NAMES.project, arguments: { project: "example-org/omega-app" } })));
    expect(unknown).toMatchObject({ isError: true, content: [{ text: "No watched project has that name. get_overview lists the watched projects." }] });
    const extra = await endpoint(ctx, rpc(token, "tools/call", { name: MCP_TOOL_NAMES.inbox, arguments: { project: "x/y" } }));
    expect(JSON.stringify(await readResult(extra))).toContain("Unknown fields");
  });

  it("refuses a request without a token and one with a revoked token, with no data", async () => {
    const anonymous = await endpoint(ctx, rpc(null, "tools/call", { name: MCP_TOOL_NAMES.inbox, arguments: {} }));
    expect(anonymous.status).toBe(401);
    expect(await anonymous.text()).not.toContain("oq-1a2b3c");

    const issued = await issueAccessToken(ctx, { userId, name: "Old assistant", canWrite: false });
    if (!issued.ok) throw new Error(issued.error);
    await revokeAccessToken(ctx, { userId, tokenId: issued.value.id });
    const revoked = await endpoint(ctx, rpc(issued.value.token, "tools/call", { name: MCP_TOOL_NAMES.inbox, arguments: {} }));
    expect(revoked.status).toBe(401);
    expect(await revoked.text()).not.toContain("oq-1a2b3c");
  });
});
