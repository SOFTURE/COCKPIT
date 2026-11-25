import { afterEach, describe, expect, it } from "vitest";
import { runLoggedTool } from "../../src/mcp/cockpit-server.ts";
import { captureLogs, type CapturedLogs } from "../support/capture-logs.ts";

describe("runLoggedTool", () => {
  let logs: CapturedLogs | null = null;

  afterEach(() => {
    logs?.restore();
    logs = null;
  });

  it("logs a call with the tool, the account and its duration, never the answer", async () => {
    logs = captureLogs();
    const result = await runLoggedTool("get_inbox", "user-1", () => Promise.resolve("the private answer"));

    expect(result.isError).not.toBe(true);
    const [line] = logs.find("mcp: mcp tool called");
    expect(line).toContain("tool=get_inbox");
    expect(line).toContain("user_id=user-1");
    expect(line).toMatch(/duration_ms=\d+/);
    expect(logs.lines().join("\n")).not.toContain("private answer");
  });

  it("logs a refusal with its code at info, and a thrown error at error", async () => {
    logs = captureLogs();
    await runLoggedTool("get_project", "user-1", () => Promise.resolve({ ok: false, error: "mcp.project_unknown" }));
    await runLoggedTool("get_project", "user-1", () => Promise.reject(new Error("boom")));

    expect(logs.find("info mcp: mcp tool refused")[0]).toContain("code=mcp.project_unknown");
    expect(logs.find("error mcp: mcp tool failed")[0]).toContain("tool=get_project");
  });
});
