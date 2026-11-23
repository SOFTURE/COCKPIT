import { ADMIN_ROLE } from "@softure-ai/auth";
import { createSession, findSessionUser, grantRole, inviteUser, listInvitations, registerInvitedUser, revokeInvitation } from "@softure-ai/auth/server";
import { createTestAccount } from "@softure-ai/auth/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listMembers, removeMember } from "../../src/team/members.ts";
import { createTestContext, type TestContext } from "../support/test-context.ts";

const PASSWORD = "a long test password";
const TEAMMATE = "teammate@example.com";

/** Invites `email` as `inviterId` and returns the token the console sender printed. */
async function invite(context: TestContext, inviterId: string, email: string): Promise<string> {
  const printed = vi.spyOn(console, "info").mockImplementation(() => undefined);
  try {
    const invited = await inviteUser(context, { email, roles: [], inviterId });
    expect(invited.ok).toBe(true);
    const line = printed.mock.calls.map((call) => String(call[0])).find((text) => text.includes(email)) ?? "";
    const token = new URL(line.slice(line.lastIndexOf("http"))).searchParams.get("invitation");
    expect(token).not.toBeNull();
    return token ?? "";
  } finally {
    printed.mockRestore();
  }
}

function accept(context: TestContext, token: string, email = TEAMMATE) {
  return registerInvitedUser(context, { token, email, password: PASSWORD, hasConsented: true, clientKey: "test-client" });
}

describe("team", () => {
  let context: TestContext;
  let ownerId: string;

  beforeEach(async () => {
    context = await createTestContext();
    const owner = await createTestAccount(context.db, { email: "owner@example.com", password: PASSWORD, createdAt: new Date(context.clock.now().getTime() - 60_000) });
    ownerId = owner.id;
    const granted = await grantRole(context, { userId: owner.id, role: ADMIN_ROLE });
    expect(granted.ok).toBe(true);
  });

  afterEach(async () => {
    await context.database.close();
  });

  it("lets an invited address create its account while registration stays closed, without admin", async () => {
    const token = await invite(context, ownerId, TEAMMATE);

    const accepted = await accept(context, token);

    expect(accepted.ok).toBe(true);
    const members = await listMembers(context.db);
    expect(members.ok && members.value.map((member) => [member.email, member.isAdmin])).toEqual([
      ["owner@example.com", true],
      [TEAMMATE, false],
    ]);
  });

  it("creates no account from a used, revoked or expired link", async () => {
    const used = await invite(context, ownerId, TEAMMATE);
    expect((await accept(context, used)).ok).toBe(true);
    expect(await accept(context, used)).toMatchObject({ ok: false, error: "auth.invitation_invalid" });

    const revokedToken = await invite(context, ownerId, "second@example.com");
    const [pending] = (await listInvitations(context)).filter((view) => view.email === "second@example.com");
    expect((await revokeInvitation(context, { invitationId: pending?.id ?? "", actorId: ownerId })).ok).toBe(true);
    expect(await accept(context, revokedToken, "second@example.com")).toMatchObject({ ok: false, error: "auth.invitation_invalid" });

    const expiredToken = await invite(context, ownerId, "third@example.com");
    context.clock.advance(73 * 60 * 60 * 1000);
    expect(await accept(context, expiredToken, "third@example.com")).toMatchObject({ ok: false, error: "auth.invitation_invalid" });

    const members = await listMembers(context.db);
    expect(members.ok && members.value.map((member) => member.email)).toEqual(["owner@example.com", TEAMMATE]);
  });

  it("removes a teammate with their sessions, so their next request finds no session", async () => {
    const teammate = await createTestAccount(context.db, { email: TEAMMATE, password: PASSWORD, createdAt: context.clock.now() });
    const session = await createSession(context, teammate.id);
    expect(await findSessionUser(context, session.token)).not.toBeNull();

    const removed = await removeMember(context, { actorId: ownerId, memberId: teammate.id });

    expect(removed).toEqual({ ok: true, value: undefined });
    expect(await findSessionUser(context, session.token)).toBeNull();
    const members = await listMembers(context.db);
    expect(members.ok && members.value.map((member) => member.email)).toEqual(["owner@example.com"]);
  });

  it("refuses to remove the signed-in admin themselves", async () => {
    expect(await removeMember(context, { actorId: ownerId, memberId: ownerId })).toEqual({ ok: false, error: "team.cannot_remove_yourself" });
  });

  it("refuses to remove an account that does not exist", async () => {
    const removed = await removeMember(context, { actorId: ownerId, memberId: "00000000-0000-4000-8000-000000000000" });

    expect(removed).toEqual({ ok: false, error: "team.member_not_found" });
  });
});
