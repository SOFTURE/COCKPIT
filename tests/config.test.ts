import { getAuthRoutes, isRegistrationClosed, registerUser } from "@softure-ai/auth/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import config, { LANDING_PATH } from "../softure.config.ts";
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
});
