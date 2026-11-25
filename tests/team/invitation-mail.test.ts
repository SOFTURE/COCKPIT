import { ADMIN_ROLE, auth } from "@softure-ai/auth";
import { grantRole, inviteUser, listInvitations, registerInvitedUser } from "@softure-ai/auth/server";
import { createTestAccount } from "@softure-ai/auth/testing";
import type { SoftureConfig } from "@softure-ai/core";
import { registerSoftureConfig } from "@softure-ai/core/next";
import { mailing } from "@softure-ai/mailing";
import { fakeMailProvider, type FakeMailProvider } from "@softure-ai/mailing/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listMembers } from "../../src/team/members.ts";
import { getInvitationSender } from "../../src/team/invitation-sender.ts";
import { createTestContext, type TestContext } from "../support/test-context.ts";

const APP_ORIGIN = "https://cockpit.example.test";
const PASSWORD = "a long test password";
const TEAMMATE = "teammate@example.com";

describe("the invitation mail in production", () => {
  let context: TestContext;
  let ownerId: string;

  /** The app's config with production's invitation sender and `provider` in place of Resend, registered. */
  function useProductionMail(provider: FakeMailProvider): TestContext {
    const config: SoftureConfig = {
      ...context.config,
      appOrigin: APP_ORIGIN,
      modules: context.config.modules.map((module) => {
        if (module.manifest.id === "mailing") {
          return mailing({ from: "COCKPIT <team@example.com>", provider });
        }
        if (module.manifest.id === "auth") {
          return auth({ registrationClosed: true, invitations: { send: getInvitationSender("production") } });
        }
        return module;
      }),
    };
    registerSoftureConfig(config);
    return { ...context, config };
  }

  beforeEach(async () => {
    context = await createTestContext();
    const owner = await createTestAccount(context.db, { email: "owner@example.com", password: PASSWORD, createdAt: new Date(context.clock.now().getTime() - 60_000) });
    ownerId = owner.id;
    expect((await grantRole(context, { userId: owner.id, role: ADMIN_ROLE })).ok).toBe(true);
  });

  afterEach(async () => {
    registerSoftureConfig(context.config);
    await context.database.close();
  });

  it.each(["development", undefined])("prints the link outside production (NODE_ENV %s), and logs the send without it", async (nodeEnv) => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    try {
      await getInvitationSender(nodeEnv)("https://cockpit.example.test/invite#secret-link", { email: TEAMMATE }, {
        expiresAt: new Date("2026-11-30T00:00:00Z"),
        locale: "en",
        roles: [],
      });
      expect(info.mock.calls.flat().join(" ")).toContain("https://cockpit.example.test/invite#secret-link");
      const logged = log.mock.calls.flat().join(" ");
      expect(logged).toContain("team: invitation sent");
      expect(logged).not.toContain("secret-link");
      expect(logged).not.toContain(TEAMMATE);
    } finally {
      info.mockRestore();
      log.mockRestore();
    }
  });

  it("mails the invited address one link on the app's origin, and that link creates the account", async () => {
    const provider = fakeMailProvider();
    const production = useProductionMail(provider);

    const invited = await inviteUser(production, { email: TEAMMATE, roles: [], inviterId: ownerId });

    expect(invited.ok).toBe(true);
    expect(provider.sent.map((mail) => mail.to)).toEqual([TEAMMATE]);
    const [mail] = provider.sent;
    const link = /https:\/\/\S+/.exec(mail?.text ?? "")?.[0] ?? "";
    expect(new URL(link).origin).toBe(APP_ORIGIN);
    expect(mail?.html).toContain(`href="${link.replaceAll("&", "&amp;")}"`);
    const token = new URL(link).searchParams.get("invitation") ?? "";
    const accepted = await registerInvitedUser(production, { token, email: TEAMMATE, password: PASSWORD, hasConsented: true, clientKey: "test-client" });
    expect(accepted.ok).toBe(true);
    const members = await listMembers(context.db);
    expect(members.ok && members.value.map((member) => member.email)).toEqual(["owner@example.com", TEAMMATE]);
  });

  it("keeps the invitation pending, not sent, when the mail provider refuses it", async () => {
    const production = useProductionMail(fakeMailProvider({ respond: () => ({ status: "unavailable", httpStatus: 503 }) }));

    const invited = await inviteUser(production, { email: TEAMMATE, roles: [], inviterId: ownerId });

    expect(invited).toMatchObject({ ok: false, error: "auth.invitation_not_sent" });
    const pending = (await listInvitations(production)).filter((view) => view.email === TEAMMATE);
    expect(pending).toHaveLength(1);
  });
});
