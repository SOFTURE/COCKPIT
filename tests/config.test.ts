import { getAuthRoutes, isRegistrationClosed, registerUser } from "@softure-ai/auth/server";
import { getModule } from "@softure-ai/core";
import { getMcpAccessOptions } from "@softure-ai/mcp-access/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import config, { LANDING_PATH } from "../softure.config.ts";
import { isMcpWritingAllowed } from "../src/mcp/mcp-writes.ts";
import { handlers } from "../src/jobs/handlers.ts";
import { createTestContext, getModuleHealth, type TestContext } from "./support/test-context.ts";

describe("the app configuration", () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestContext();
  });

  afterEach(async () => {
    await ctx.database.close();
  });

  it("lands the signed-in owner on the inbox and the signed-out one on the login page", () => {
    expect(getAuthRoutes(config)).toMatchObject({ afterLogin: "/inbox", afterLogout: "/login", login: "/login" });
    expect(LANDING_PATH).toBe("/inbox");
  });

  it("keeps registration closed", async () => {
    expect(await isRegistrationClosed(ctx)).toBe(true);
    const result = await registerUser(ctx, {
      email: "visitor@example.com",
      password: "correct horse battery staple",
      hasConsented: true,
      clientKey: "ip:198.18.0.1",
    });
    expect(result).toMatchObject({ ok: false, error: "auth.registration_closed" });
  });

  it("answers the auth health check on a migrated database", async () => {
    expect(await getModuleHealth("auth")(ctx)).toEqual({ ok: true, value: undefined });
  });

  it("gives every scheduled job a handler in the worker, the MCP token prune included", () => {
    const options = getModule(config, "jobs")?.options as { schedules: Record<string, unknown> } | undefined;
    const scheduled = Object.keys(options?.schedules ?? {});
    expect(scheduled).toContain("mcp-access.prune");
    expect(scheduled.filter((queue) => !(queue in handlers))).toEqual([]);
  });

  it("lets a write token answer over MCP, with OAuth on and client registration closed", () => {
    expect(getMcpAccessOptions(config)).toMatchObject({
      serverName: "cockpit",
      allowWrites: true,
      oauth: { enabled: true, registration: "closed" },
    });
  });

  it.each([
    [undefined, true],
    ["1", true],
    ["", true],
    ["0", false],
    [" 0 ", false],
  ])("allows MCP writes for MCP_ALLOW_WRITES=%j: %s", (value, allowed) => {
    expect(isMcpWritingAllowed(value)).toBe(allowed);
  });
});
