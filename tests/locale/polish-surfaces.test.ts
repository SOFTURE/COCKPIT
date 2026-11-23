// With the locale `pl` every surface COCKPIT owns or configures speaks Polish: the module pages and mails, the MCP
// server, the tool catalog, the digest, the CLI and the time format. Expected texts come from the dictionaries.
import { getAuthMessages } from "@softure-ai/auth/next";
import { getAuthOptions } from "@softure-ai/auth/server";
import { createTestAccount } from "@softure-ai/auth/testing";
import { defineSoftureConfig, getModule, selectMessages } from "@softure-ai/core";
import { createMcpEndpoint, issueAccessToken } from "@softure-ai/mcp-access/server";
import { describe, expect, it } from "vitest";
import { fillMessage, getMessages } from "../../messages/index.ts";
import { authPl } from "../../messages/packages/auth-pl.ts";
import { mailingPl } from "../../messages/packages/mailing-pl.ts";
import { mcpAccessPl } from "../../messages/packages/mcp-access-pl.ts";
import { pl } from "../../messages/pl.ts";
import config from "../../softure.config.ts";
import { inboxAnswerSchema, overviewAnswerSchema } from "../../cli/answer-schemas.ts";
import { renderInbox, renderOverview } from "../../cli/render-views.ts";
import { renderDigest } from "../../src/digest/render-digest.ts";
import { toInboxAnswer, toOverviewAnswer } from "../../src/mcp/answers.ts";
import { createCockpitServerFactory } from "../../src/mcp/cockpit-server.ts";
import { MCP_TOOL_CATALOG } from "../../src/mcp/tool-catalog.ts";
import { createTimeFormatter } from "../../src/projects/format-time.ts";
import { FIXTURE_READER } from "../mcp/cockpit-fixture.ts";
import { createTestContext } from "../support/test-context.ts";

const polishConfig = defineSoftureConfig({ ...config, locale: "pl" });

describe("the module dictionaries", () => {
  it("give auth's sign-in, invitation and mail copy in Polish", () => {
    const messages = getAuthMessages(polishConfig);
    expect(messages.login.title).toBe(authPl.login.title);
    expect(messages.invitationMail?.subject).toBe(authPl.invitationMail.subject);
    expect(getAuthMessages(config).login.title).toBe("Log in");
  });

  it("give mailing's footer and unsubscribe page in Polish", () => {
    const mailing = getModule(polishConfig, "mailing");
    const messages = selectMessages(mailing?.messages ?? { en: mailingPl }, "pl") as typeof mailingPl;
    expect(messages.unsubscribe.title).toBe(mailingPl.unsubscribe.title);
  });

  it("give the token page in Polish and keep the assistant-facing texts in English", () => {
    const access = getModule(polishConfig, "mcp-access");
    const messages = selectMessages(access?.messages ?? { en: {} }, "pl") as { page: { title: string }; confirmation: { used: string } };
    expect(messages.page.title).toBe(mcpAccessPl.page?.title);
    expect(messages.confirmation.used).toMatch(/^input\.confirmation_used: /u);
  });

  it("list every tool of the catalog in English and Polish", () => {
    for (const tool of MCP_TOOL_CATALOG) {
      expect(tool.title?.pl, tool.name).toBeTruthy();
      expect(tool.description.pl, tool.name).not.toBe(tool.description.en);
    }
  });
});

describe("the MCP server in Polish", () => {
  it("describes its tools in Polish", async () => {
    const ctx = await createTestContext();
    try {
      const account = await createTestAccount(ctx.database.db, {
        email: "owner@example.com",
        createdAt: new Date(ctx.clock.now().getTime() - 60_000),
        password: "correct horse battery staple",
        scrypt: getAuthOptions(config).password.scrypt,
      });
      const issued = await issueAccessToken(ctx, { userId: account.id, name: "Assistant", canWrite: true });
      if (!issued.ok) throw new Error(issued.error);
      const server = createCockpitServerFactory({ reader: FIXTURE_READER, answer: () => Promise.reject(new Error("never answers")), messages: pl });
      const endpoint = createMcpEndpoint({ createServer: server });
      const request = new Request("http://localhost:3000/api/mcp", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
          "mcp-protocol-version": "2025-06-18",
          "cf-connecting-ip": "198.18.0.8",
          authorization: `Bearer ${issued.value.token}`,
        },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
      });
      const text = await (await endpoint(ctx, request)).text();
      const json = text.startsWith("{") ? text : (text.split("\n").find((line) => line.startsWith("data:")) ?? "").slice(5);
      const tools = (JSON.parse(json) as { result: { tools: { name: string; title?: string; description?: string }[] } }).result.tools;
      expect(tools.find((tool) => tool.name === "get_overview")?.title).toBe(pl.mcp.tools.getOverview.title);
      expect(tools.find((tool) => tool.name === "answer_entry")?.description).toBe(pl.mcp.tools.answerEntry.description);
    } finally {
      await ctx.database.close();
    }
  });
});

describe("the digest and the CLI in Polish", () => {
  it("render the digest mail with the Polish copy", () => {
    const mail = renderDigest({
      appOrigin: "https://cockpit.example.test",
      messages: getMessages("pl"),
      changes: { shipped: [], waiting: [{ projectKey: "example-org/alpha-app", projectName: "example-org/alpha-app", entryId: "oq-2", text: "Release 1.1.0?" }], broke: [] },
    });
    expect(mail.subject).toBe(pl.digest.subjectOne);
    expect(mail.text).toContain(pl.digest.waiting);
    expect(mail.text).toContain("Release 1.1.0?");
  });

  it("render the CLI's tables with Polish headings", async () => {
    const inbox = await FIXTURE_READER.readInbox();
    const context = { messages: pl, formatTime: (date: Date) => date.toISOString() };
    // The CLI reads the answers as they come over the wire, through its own schemas.
    const overviewAnswer = overviewAnswerSchema.parse(JSON.parse(JSON.stringify(toOverviewAnswer(await FIXTURE_READER.readOverview(inbox)))));
    const overview = renderOverview(overviewAnswer, context);
    expect(overview.split("\n")[0]).toBe(fillMessage(pl.cli.groupHeading, { status: pl.overview.statuses.waiting, count: 1 }));
    expect(overview).toContain(pl.cli.columns.qualityReview);
    const inboxText = renderInbox(inboxAnswerSchema.parse(JSON.parse(JSON.stringify(toInboxAnswer(inbox)))), context);
    expect(inboxText.split("\n")[0]).toBe(fillMessage(pl.cli.unanswered, { count: 2 }));
    expect(inboxText).toContain(pl.inbox.kinds.decision);
  });

  it("format dates the Polish way", () => {
    const format = createTimeFormatter("pl", "Europe/Warsaw");
    expect(format(new Date("2026-11-23T19:05:00Z"))).toBe("23 lis 2026, 20:05");
  });
});
