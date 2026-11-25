import { createLogger } from "@softure-ai/observability";
import { afterEach, describe, expect, it } from "vitest";
import { createForgeClient, toLoggedPath } from "../../src/forge/client.ts";
import { captureLogs, type CapturedLogs } from "../support/capture-logs.ts";

const API = "https://forge.example.test";

function answer(status: number, body: unknown = {}): typeof fetch {
  return () => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "x-ratelimit-remaining": "4000" } }));
}

describe("the forge client's log", () => {
  let logs: CapturedLogs | null = null;

  afterEach(() => {
    logs?.restore();
    logs = null;
  });

  it("warns about a read the forge could not answer, with the path without its query, never the token", async () => {
    logs = captureLogs();
    const client = createForgeClient({ token: "secret-token", baseUrl: API, fetch: answer(502) });

    await client.getJsonFile("example-org", "alpha-app", "context/state.json", "main");

    const [line] = logs.find("forge: forge read failed");
    expect(line).toContain("method=GET");
    expect(line).toContain("path=/repos/example-org/alpha-app/contents/context/state.json");
    expect(line).toContain("status=502");
    expect(line).toContain("kind=unavailable");
    expect(line).not.toContain("ref=main");
    expect(logs.lines().join("\n")).not.toContain("secret-token");
  });

  it("keeps a missing file and a refused token at debug, below the default level", async () => {
    logs = captureLogs();
    for (const status of [404, 403]) {
      await createForgeClient({ token: "t", baseUrl: API, fetch: answer(status) }).getJsonFile("example-org", "alpha-app", "ops/grafana/rules.json", "main");
    }
    expect(logs.lines()).toEqual([]);
  });

  it("logs the created issue at info and a failed write at error", async () => {
    logs = captureLogs();
    const issue = { title: "COCKPIT command: Yes, x", body: "private note", labels: ["cockpit"] };
    await createForgeClient({ token: "t", baseUrl: API, fetch: answer(201, { number: 7, html_url: `${API}/i/7` }) }).createIssue("example-org", "alpha-app", issue);
    await createForgeClient({ token: "t", baseUrl: API, fetch: answer(422) }).createIssue("example-org", "alpha-app", issue);

    expect(logs.find("forge: forge issue created")[0]).toContain("issue=7");
    expect(logs.find("error forge: forge write failed")[0]).toContain("kind=refused");
    expect(logs.lines().join("\n")).not.toContain("private note");
  });

  it("writes to the logger it is given", async () => {
    const lines: string[] = [];
    const logger = { ...createLogger("x"), warn: (message: string) => lines.push(message) };
    await createForgeClient({ token: "t", baseUrl: API, fetch: answer(500), logger }).getRepository("example-org", "alpha-app");
    expect(lines).toEqual(["forge read failed"]);
  });
});

describe("toLoggedPath", () => {
  it("drops the origin and the query", () => {
    expect(toLoggedPath(`${API}/repos/o/n/issues?labels=cockpit&state=all`, API)).toBe("/repos/o/n/issues");
    expect(toLoggedPath("https://other.example.test/repos/o/n?page=2", API)).toBe("/repos/o/n");
    expect(toLoggedPath("/repos/o/n/labels/cockpit", API)).toBe("/repos/o/n/labels/cockpit");
  });
});
