import { getAuthOptions } from "@softure-ai/auth/server";
import { createTestAccount } from "@softure-ai/auth/testing";
import { createMcpEndpoint, issueAccessToken, revokeAccessToken } from "@softure-ai/mcp-access/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runCli, type CliIo } from "../../cli/run-cli.ts";
import config from "../../softure.config.ts";
import { createCockpitServerFactory } from "../../src/mcp/cockpit-server.ts";
import { HOSTILE_TEXT, FIXTURE_READER } from "../mcp/cockpit-fixture.ts";
import { createTestContext, type TestContext } from "../support/test-context.ts";

const endpoint = createMcpEndpoint({ createServer: createCockpitServerFactory({ reader: FIXTURE_READER }) });
const URL_VALUE = "http://cockpit.example.test";
const formatTime = (date: Date) => date.toISOString();

/** A fetch that hands the CLI's request to an endpoint, as the app's route would. */
function routeTo(target: typeof endpoint, ctx: TestContext): typeof fetch {
  return async (input, init) => {
    const request = new Request(input, init);
    const headers = new Headers(request.headers);
    headers.set("cf-connecting-ip", "198.18.0.9");
    return target(ctx, new Request(request.url, { method: request.method, headers, body: await request.text() }));
  };
}

interface Run {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

describe("the cockpit CLI", () => {
  let ctx: TestContext;
  let userId: string;
  let token: string;
  let fetchStub: typeof fetch;

  beforeEach(async () => {
    ctx = await createTestContext();
    const account = await createTestAccount(ctx.database.db, {
      email: "owner@example.com",
      createdAt: new Date(ctx.clock.now().getTime() - 60_000),
      password: "correct horse battery staple",
      scrypt: getAuthOptions(config).password.scrypt,
    });
    userId = account.id;
    const issued = await issueAccessToken(ctx, { userId, name: "Terminal", canWrite: false });
    if (!issued.ok) throw new Error(issued.error);
    token = issued.value.token;
    fetchStub = routeTo(endpoint, ctx);
  });

  afterEach(async () => {
    await ctx.database.close();
  });

  async function run(argv: string[], overrides: Partial<CliIo> = {}): Promise<Run> {
    const out: string[] = [];
    const errors: string[] = [];
    const code = await runCli(argv, {
      env: { COCKPIT_URL: URL_VALUE, COCKPIT_TOKEN: token },
      fetch: fetchStub,
      stdout: (text) => out.push(text),
      stderr: (text) => errors.push(text),
      formatTime,
      ...overrides,
    });
    return { code, stdout: out.join("\n"), stderr: errors.join("\n") };
  }

  it("prints the overview as one table per status group, worded as the screen", async () => {
    const result = await run(["overview"]);
    expect(result).toMatchObject({ code: 0, stderr: "" });
    const lines = result.stdout.split("\n");
    expect(lines[0]).toBe("Waiting for you (1)");
    expect(lines[1]).toMatch(/^Project\s+Roadmap\s+Queued\s+Changes\s+Waiting\s+Release\s+Doctor\s+CI\s+Quality review\s+Read$/);
    const alpha = lines.find((line) => line.startsWith("example-org/alpha-app")) ?? "";
    expect(alpha.split(/\s{2,}/)).toEqual([
      "example-org/alpha-app",
      expect.stringMatching(/^\S+ \d+\/\d+$/),
      "0",
      "0",
      "2",
      "Release v0.4.1 (2026-11-03)",
      "Doctor OK",
      "CI passed 2026-11-10T10:00:00.000Z",
      "Quality review: none",
      "Read 2026-11-10T11:30:00.000Z",
    ]);
    expect(result.stdout).toContain("example-org/beta-app");
  });

  it("prints the inbox entries oldest first with kind, item, age and answer state", async () => {
    const result = await run(["inbox"]);
    expect(result.code).toBe(0);
    const lines = result.stdout.split("\n");
    expect(lines[0]).toBe("Unanswered: 2");
    expect(lines[2]).toMatch(/^Project\s+Entry\s+Kind\s+Item\s+Source\s+Age\s+Answer$/);
    expect(lines[4]).toMatch(/^example-org\/alpha-app\s+Pick the mail provider .+\s+Decision\s+AL-2\s+context\/foundation\/roadmap\.md\s+9 days\s+open$/);
    expect(lines[5]).toMatch(/^example-org\/alpha-app\s+Add the mail key\s+Secret\s+AL-3\s+context\/foundation\/roadmap\.md\s+2 days\s+open$/);
  });

  it("prints one project's facts and entries, any letter case", async () => {
    const result = await run(["project", "Example-Org/Alpha-App"]);
    expect(result.code).toBe(0);
    expect(result.stdout).toMatch(/^Project\s+example-org\/alpha-app$/m);
    expect(result.stdout).toMatch(/^Status\s+Waiting for you$/m);
    expect(result.stdout).toMatch(/^Waiting\s+2$/m);
    expect(result.stdout).toMatch(/^Add the mail key\s+Secret\s+AL-3/m);
  });

  it("prints the tool's data as JSON with --json", async () => {
    const result = await run(["inbox", "--json"]);
    expect(result.code).toBe(0);
    const inbox = JSON.parse(result.stdout) as { unansweredCount: number; entries: { id: string }[] };
    expect(inbox.unansweredCount).toBe(2);
    expect(inbox.entries.map((entry) => entry.id)).toEqual(["oq-1a2b3c", "oq-4d5e6f"]);
  });

  it("never lets a marker or a control character from repository text reach the terminal raw", async () => {
    const hostile = (text: string) => ({ ...FIXTURE_READER, readInbox: async () => {
      const inbox = await FIXTURE_READER.readInbox();
      const [first, ...rest] = inbox.rows;
      if (first === undefined) throw new Error("fixture has no entry");
      return { ...inbox, rows: [{ ...first, entry: { ...first.entry, text } }, ...rest] };
    } });
    const escaping = createMcpEndpoint({ createServer: createCockpitServerFactory({ reader: hostile(`Clear \u001b[2J screen\u0007 ${HOSTILE_TEXT}`) }) });
    const result = await run(["inbox"], {
      fetch: routeTo(escaping, ctx),
    });
    expect(result.code).toBe(0);
    expect([...result.stdout].filter((char) => char !== "\n" && (char < " " || char === "\u007f"))).toEqual([]);
    expect(result.stdout).toContain("Clear  [2J screen");
  });

  it("refuses to run without a token or an address, naming what is missing", async () => {
    const noToken = await run(["overview"], { env: { COCKPIT_URL: URL_VALUE } });
    expect([noToken.code, noToken.stdout]).toEqual([2, ""]);
    expect(noToken.stderr).toContain("set COCKPIT_TOKEN");
    const noUrl = await run(["overview"], { env: { COCKPIT_TOKEN: token } });
    expect([noUrl.code, noUrl.stdout]).toEqual([2, ""]);
    expect(noUrl.stderr).toContain("COCKPIT_URL");
    const badUrl = await run(["overview", "--url", "ftp://cockpit.example.test"]);
    expect(badUrl).toEqual({ code: 2, stdout: "", stderr: "The address ftp://cockpit.example.test is not a valid http or https URL." });
  });

  it("says COCKPIT refused a revoked token, with no data and no stack", async () => {
    const issued = await issueAccessToken(ctx, { userId, name: "Old terminal", canWrite: false });
    if (!issued.ok) throw new Error(issued.error);
    await revokeAccessToken(ctx, { userId, tokenId: issued.value.id });
    token = issued.value.token;
    const result = await run(["inbox"]);
    expect(result).toEqual({
      code: 1,
      stdout: "",
      stderr: "COCKPIT at http://cockpit.example.test refused the token: it is unknown, revoked or expired. Create a new one on the token page.",
    });
  });

  it("names the address when COCKPIT does not answer", async () => {
    const result = await run(["overview"], {
      fetch: () => Promise.reject(new TypeError("fetch failed", { cause: new Error("connect ECONNREFUSED 127.0.0.1:3000") })),
    });
    expect(result).toEqual({
      code: 1,
      stdout: "",
      stderr: "COCKPIT at http://cockpit.example.test did not answer (connect ECONNREFUSED 127.0.0.1:3000). Check the address and that COCKPIT is running.",
    });
    expect(result.stderr).not.toContain("    at ");
  });

  it("passes on the server's hint for an unknown project", async () => {
    const result = await run(["project", "example-org/omega-app"]);
    expect(result).toEqual({
      code: 1,
      stdout: "",
      stderr: "COCKPIT could not answer get_project: No watched project has that name. get_overview lists the watched projects.",
    });
  });

  it("reports an answer it cannot read instead of printing it", async () => {
    const result = await run(["overview"], { fetch: () => Promise.resolve(new Response("<html>login</html>", { status: 200 })) });
    expect(result).toMatchObject({ code: 1, stdout: "" });
    expect(result.stderr).toContain("cannot read");
  });

  it("prints the usage on --help and refuses an unknown command or option", async () => {
    const help = await run(["--help"]);
    expect(help.code).toBe(0);
    expect(help.stdout).toContain("Usage: cockpit <command>");
    expect(await run([])).toEqual({ code: 2, stdout: "", stderr: "Name a command: overview, inbox or project <owner/name>." });
    expect(await run(["status"])).toEqual({ code: 2, stdout: "", stderr: "Unknown command status. Run cockpit --help to list the commands." });
    expect(await run(["inbox", "--verbose"])).toEqual({ code: 2, stdout: "", stderr: "Unknown option --verbose. Run cockpit --help to list the options." });
    expect(await run(["project"])).toEqual({ code: 2, stdout: "", stderr: "Name the project as owner/name, for example cockpit project example-org/billing." });
  });
});
