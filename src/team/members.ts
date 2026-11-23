// The team (FR-16): every account sees and answers the same projects; an admin (the owner) invites people and removes
// them. Removing deletes the account with its sessions, so the person's next request finds no session.
import { ADMIN_ROLE, userRoles, users } from "@softure-ai/auth";
import { deleteAuthUserData, type AuthContext } from "@softure-ai/auth/server";
import { err, errorLogLabel, ok, type Result } from "@softure-ai/core";
import type { Queryable } from "@softure-ai/db";
import { and, asc, eq, sql } from "drizzle-orm";
import { getAnswererName } from "./answerer-name.ts";

export interface Member {
  readonly id: string;
  readonly email: string;
  readonly displayName: string | null;
  readonly joinedAt: Date;
  readonly isAdmin: boolean;
}

export type RemoveMemberErrorCode = "team.cannot_remove_yourself" | "team.member_not_found" | "team.storage_failed";

export interface RemoveMemberInput {
  /** The signed-in admin; the caller checked the role. */
  readonly actorId: string;
  readonly memberId: string;
}

/** Every account, oldest first, with whether it holds `admin`. */
export async function listMembers(db: Queryable): Promise<Result<Member[], "team.storage_failed">> {
  try {
    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        joinedAt: users.createdAt,
        isAdmin: sql<boolean>`${userRoles.role} is not null`,
      })
      .from(users)
      .leftJoin(userRoles, and(eq(userRoles.userId, users.id), eq(userRoles.role, ADMIN_ROLE)))
      .orderBy(asc(users.createdAt), asc(users.email));
    return ok(rows.map((row) => ({ ...row, isAdmin: Boolean(row.isAdmin) })));
  } catch (error) {
    console.error(`team: listing members failed: ${errorLogLabel(error)}`);
    return err("team.storage_failed");
  }
}

/** Removes another account; the admin cannot remove themselves, so the team never loses its last way in by mistake. */
export async function removeMember(context: AuthContext, input: RemoveMemberInput): Promise<Result<undefined, RemoveMemberErrorCode>> {
  if (input.memberId === input.actorId) {
    return err("team.cannot_remove_yourself");
  }
  const members = await listMembers(context.db);
  if (!members.ok) {
    return members;
  }
  if (!members.value.some((member) => member.id === input.memberId)) {
    return err("team.member_not_found");
  }
  try {
    await deleteAuthUserData(context, input.memberId);
    return ok();
  } catch (error) {
    console.error(`team: removing member ${input.memberId} failed: ${errorLogLabel(error)}`);
    return err("team.storage_failed");
  }
}

/** The account's name as people read it (FR-16), for a path that knows only the account, such as an assistant's token. */
export async function findAnswererName(db: Queryable, userId: string): Promise<Result<string, "team.member_not_found" | "team.storage_failed">> {
  try {
    const [row] = await db.select({ email: users.email, displayName: users.displayName }).from(users).where(eq(users.id, userId)).limit(1);
    return row === undefined ? err("team.member_not_found") : ok(getAnswererName(row));
  } catch (error) {
    console.error(`team: reading the name of account ${userId} failed: ${errorLogLabel(error)}`);
    return err("team.storage_failed");
  }
}
