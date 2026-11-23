import { getAuthOptions } from "@softure-ai/auth/server";
import { createTestAccount } from "@softure-ai/auth/testing";
import { createMcpEndpoint, issueAccessToken, revokeAccessToken } from "@softure-ai/mcp-access/server";
import { expectToolCatalogMatchesServer, measureServedToolLists } from "@softure-ai/mcp-access/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findAnswers } from "../../modules/projects/answers.ts";
import { insertRepository } from "../../modules/projects/queries.ts";
import { recordRead } from "../../modules/projects/reads.ts";
import config from "../../softure.config.ts";
import { createForgeClient } from "../../src/forge/client.ts";
import { answerAsAccount } from "../../src/mcp/answer-as-account.ts";
import { parseOwnerWordMarker } from "../../src/inbox/owner-word-marker.ts";
import { createCockpitServerFactory, untrustedText } from "../../src/mcp/cockpit-server.ts";
import { MCP_TOOL_NAMES } from "../../src/mcp/tool-catalog.ts";
import { TEST_FORGE_API } from "../support/fake-forge-routes.ts";
import { createMemoryForge, type MemoryForge } from "../support/memory-forge.ts";
import { createTestContext, TEST_START, type TestContext } from "../support/test-context.ts";
import { FIXTURE_READER, FIXTURE_STATES, HOSTILE_TEXT } from "./cockpit-fixture.ts";

const ALPHA = "example-org/alpha-app";

/** The test the answer tool writes through: its database and its memory forge. */
let answerTarget: { ctx: TestContext; forge: MemoryForge } | null = null;

const createServer = createCockpitServerFactory({
  reader: FIXTURE_READER,
  answer: (request) => {
    if (answerTarget === null) throw new Error("answer: no test target");
    const { ctx, forge } = answerTarget;
    const client = createForgeClient({ token: "test-token", baseUrl: TEST_FORGE_API, fetch: forge.fetch });
    return answerAsAccount({ db: ctx.db, client, clock: ctx.clock, request });
  },
});
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
    answerTarget = null;
    await ctx.database.close();
  });

  it("lists the same tools as the token page's catalog, the answer tool for write access only", async () => {
    await expectToolCatalogMatchesServer(config, createServer);
    const lists = await measureServedToolLists(createServer);
    expect({ read: lists.read.toolCount, write: lists.write.toolCount }).toEqual({ read: 3, write: 4 });
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

  describe("answering an entry", () => {
    let forge: MemoryForge;
    let writeToken: string;

    beforeEach(async () => {
      forge = createMemoryForge(ALPHA, () => ctx.clock.now());
      answerTarget = { ctx, forge };
      await insertRepository(ctx.db, { key: ALPHA, fullName: ALPHA, defaultBranch: "main", hasState: true, missingPermissions: [], checkedAt: TEST_START });
      const recorded = await recordRead(ctx.db, {
        key: ALPHA,
        status: "ok",
        issuesStatus: "ok",
        state: FIXTURE_STATES[ALPHA],
        issues: [],
        readAt: ctx.clock.now(),
      });
      expect(recorded.ok).toBe(true);
      const issued = await issueAccessToken(ctx, { userId, name: "Writing assistant", canWrite: true });
      if (!issued.ok) throw new Error(issued.error);
      writeToken = issued.value.token;
    });

    function answer(tokenValue: string, args: Record<string, unknown>) {
      return endpoint(ctx, rpc(tokenValue, "tools/call", { name: MCP_TOOL_NAMES.answerEntry, arguments: args }));
    }

    const MAIL_KEY = { project: ALPHA, entry: "oq-4d5e6f", text: "Add the mail key", answer: "later", note: "After the provider is picked." };

    it("refuses a read token and writes nothing", async () => {
      const response = await answer(token, MAIL_KEY);
      expect(await response.text()).toContain("Tool answer_entry not found");
      expect(forge.calls.filter((call) => call.method !== "GET")).toEqual([]);
      const answers = await findAnswers(ctx.db);
      expect(answers.ok && answers.value).toEqual([]);
    });

    it("lists the answer tool to a write token, marked as a write", async () => {
      const result = await readResult(await endpoint(ctx, rpc(writeToken, "tools/list")));
      const tools = result.tools as { name: string; annotations?: { readOnlyHint?: boolean } }[];
      expect(tools.map((tool) => tool.name).sort()).toEqual(["answer_entry", "get_inbox", "get_overview", "get_project"]);
      expect(tools.find((tool) => tool.name === "answer_entry")?.annotations?.readOnlyHint).toBe(false);
    });

    it("answers through the inbox's rule: one owner-word issue, recorded as sent by the token's account", async () => {
      const result = await readResult(await answer(writeToken, MAIL_KEY));
      expect(result.isError ?? false).toBe(false);
      const [content] = result.content as { text: string }[];
      expect(JSON.parse(content?.text ?? "")).toEqual({
        project: ALPHA,
        entry: "oq-4d5e6f",
        answer: "later",
        issueNumber: 1,
        issueUrl: forge.issueUrl(1),
        alreadyAnswered: false,
        message: "Sent as owner-word issue #1.",
      });
      expect(forge.issues).toHaveLength(1);
      expect(forge.issues[0]?.labels).toEqual(["owner-word"]);
      expect(forge.issues[0]?.body).toContain("> After the provider is picked.");
      expect(forge.issues[0]?.body).toContain("**owner** answers **Later**");
      expect(forge.issues[0]?.body).not.toContain("owner@example.com");
      expect(parseOwnerWordMarker(forge.issues[0]?.body ?? "")).toEqual({ entry: "oq-4d5e6f", answer: "later" });
      const answers = await findAnswers(ctx.db);
      expect(answers.ok && answers.value).toMatchObject([
        { entryId: "oq-4d5e6f", answer: "later", answeredBy: userId, answeredByName: "owner@example.com", status: "sent", issueNumber: 1 },
      ]);
    });

    it("returns the existing answer and creates no second issue when the entry was answered already", async () => {
      await readResult(await answer(writeToken, MAIL_KEY));
      const again = await readResult(await answer(writeToken, { ...MAIL_KEY, answer: "yes", note: undefined }));
      const [content] = again.content as { text: string }[];
      expect(JSON.parse(content?.text ?? "")).toMatchObject({ answer: "later", issueNumber: 1, alreadyAnswered: true });
      expect(forge.issues).toHaveLength(1);
    });

    it("accepts the entry text exactly as the assistant read it, with its markers defused", async () => {
      const inbox = readAnswer(await readResult(await endpoint(ctx, rpc(writeToken, "tools/call", { name: MCP_TOOL_NAMES.inbox, arguments: {} })))) as {
        entries: { id: string; text: string }[];
      };
      const hostile = inbox.entries.find((entry) => entry.id === "oq-1a2b3c");
      expect(hostile?.text).not.toBe(HOSTILE_TEXT);

      const result = await readResult(await answer(writeToken, { project: ALPHA, entry: "oq-1a2b3c", text: hostile?.text, answer: "no" }));
      expect(result.isError ?? false).toBe(false);
      expect(forge.issues).toHaveLength(1);
      expect(forge.issues[0]?.body).toContain(HOSTILE_TEXT);
    });

    it("refuses a changed text and an unknown project in the inbox's words, and creates nothing", async () => {
      const changed = await readResult(await answer(writeToken, { ...MAIL_KEY, text: "Add the payment key" }));
      expect(changed).toMatchObject({ isError: true, content: [{ text: "The project changed this entry since the page loaded. Reload to see the new text." }] });
      const unknown = await readResult(await answer(writeToken, { ...MAIL_KEY, project: "example-org/omega-app" }));
      expect(unknown).toMatchObject({ isError: true, content: [{ text: "This project is no longer watched." }] });
      const invalid = await readResult(await answer(writeToken, { ...MAIL_KEY, project: "not a name" }));
      expect(invalid).toMatchObject({ isError: true, content: [{ text: "Name the project as owner/name, as get_overview lists it." }] });
      expect(forge.issues).toEqual([]);
    });
  });
});
