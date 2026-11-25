// The wake-up COCKPIT runs with (CT-10): its database, the system clock, the registered routine providers (CT-20;
// Claude Code at ROUTINES_API_URL) and the token box keyed by ROUTINE_TOKEN_SECRET.
import "server-only";
import { systemClock } from "@softure-ai/core";
import { getDatabase } from "../database.ts";
import { getRoutineProviders } from "./providers/registry.ts";
import { createTokenBox, getTokenSecret, type TokenBox } from "./token-box.ts";
import type { WakeDependencies } from "./wake-issue.ts";

export type WakeEnvironment = Readonly<Record<string, string | undefined>>;

/** The token box, or null while ROUTINE_TOKEN_SECRET is missing (routines cannot be stored or fired then). */
export function getTokenBox(env: WakeEnvironment = process.env): TokenBox | null {
  const secret = getTokenSecret(env);
  return secret === null ? null : createTokenBox(secret);
}

export async function getWakeDependencies(env: WakeEnvironment = process.env): Promise<WakeDependencies> {
  const { db } = await getDatabase();
  return { db, clock: systemClock, providers: getRoutineProviders(env), box: getTokenBox(env) };
}
