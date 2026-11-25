// The Claude Code routines API (CT-10): the one call COCKPIT makes there, firing a routine's trigger with a text.
// POST <base>/v1/claude_code/routines/<trigger_id>/fire, the token as a bearer. A failure comes back as the HTTP status
// and one short reason word; the token, the URL and the answer's text never leave this file, and are never logged.
import type { FetchFunction } from "@softure-ai/core";
import { z } from "zod";

export const DEFAULT_ROUTINES_API_URL = "https://api.anthropic.com";
export const ANTHROPIC_VERSION = "2023-06-01";
export const ROUTINES_BETA = "experimental-cc-routine-2026-04-01";
/** How long one fire may take before it counts as failed. */
export const FIRE_TIMEOUT_MS = 10_000;

export type FireFailureReason =
  | "rate_limited"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "rejected"
  | "server_error"
  | "unreachable"
  | "timeout";

export type FireResult =
  | { readonly ok: true; readonly status: number }
  | {
      readonly ok: false;
      /** Null when no answer arrived (unreachable, timeout). */
      readonly status: number | null;
      readonly reason: FireFailureReason;
      /** From a 429's `retry-after`, in seconds. */
      readonly retryAfterSeconds: number | null;
    };

export interface FireRequest {
  readonly triggerId: string;
  readonly token: string;
  readonly text: string;
}

export interface RoutinesApi {
  fire(request: FireRequest): Promise<FireResult>;
}

export interface RoutinesApiOptions {
  readonly baseUrl?: string;
  readonly fetch?: FetchFunction;
  readonly timeoutMs?: number;
}

/** The base URL from ROUTINES_API_URL (the e2e points it at a fake), else the Anthropic API. */
export function getRoutinesApiUrl(env: Readonly<Record<string, string | undefined>>): string {
  const url = env.ROUTINES_API_URL?.trim() ?? "";
  return url === "" ? DEFAULT_ROUTINES_API_URL : url;
}

function toReason(status: number): FireFailureReason {
  if (status === 429) {
    return "rate_limited";
  }
  if (status === 401) {
    return "unauthorized";
  }
  if (status === 403) {
    return "forbidden";
  }
  if (status === 404) {
    return "not_found";
  }
  return status >= 500 ? "server_error" : "rejected";
}

function toRetryAfter(value: string | null): number | null {
  if (value === null || value.trim() === "") {
    return null;
  }
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.ceil(seconds);
  }
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, Math.ceil((date - Date.now()) / 1000)) : null;
}

const triggerIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,100}$/);

export function createRoutinesApi(options: RoutinesApiOptions = {}): RoutinesApi {
  const baseUrl = (options.baseUrl ?? DEFAULT_ROUTINES_API_URL).replace(/\/+$/, "");
  const fetchFunction: FetchFunction = options.fetch ?? ((input, init) => fetch(input, init));
  const timeoutMs = options.timeoutMs ?? FIRE_TIMEOUT_MS;
  return {
    fire: async ({ triggerId, token, text }) => {
      // The id is checked when stored; checked again so nothing can bend the path.
      if (!triggerIdSchema.safeParse(triggerId).success) {
        return { ok: false, status: null, reason: "rejected", retryAfterSeconds: null };
      }
      let response: Response;
      try {
        response = await fetchFunction(`${baseUrl}/v1/claude_code/routines/${triggerId}/fire`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "anthropic-version": ANTHROPIC_VERSION,
            "anthropic-beta": ROUTINES_BETA,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text }),
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (error) {
        // The error's text may hold the URL; only its kind is kept.
        const isTimeout = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
        return { ok: false, status: null, reason: isTimeout ? "timeout" : "unreachable", retryAfterSeconds: null };
      }
      // The answer's body is not needed and may echo the request: it is drained, never read into a message.
      await response.body?.cancel().catch(() => undefined);
      if (response.ok) {
        return { ok: true, status: response.status };
      }
      return {
        ok: false,
        status: response.status,
        reason: toReason(response.status),
        retryAfterSeconds: response.status === 429 ? toRetryAfter(response.headers.get("retry-after")) : null,
      };
    },
  };
}

/**
 * The text a cockpit issue fires its project's routines with, exactly as `routines/cockpit-command.md` of
 * @softure-ai/skills expects: one line linking the issue, nothing more. The routine's own prompt says how to act on it.
 */
export function formatIssueFireText(issue: { readonly fullName: string; readonly number: number }): string {
  return `COCKPIT command: https://github.com/${issue.fullName}/issues/${String(issue.number)}`;
}

/** The text of a routine's Test button (`COCKPIT test: <short text>` in `routines/cockpit-command.md`). */
export const TEST_FIRE_TEXT = "COCKPIT test: reply in this chat that the test arrived; change nothing.";
