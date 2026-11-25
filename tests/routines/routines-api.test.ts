import { describe, expect, it } from "vitest";
import {
  createRoutinesApi,
  DEFAULT_ROUTINES_API_URL,
  formatIssueFireText,
  getRoutinesApiUrl,
  TEST_FIRE_TEXT,
} from "../../src/routines/routines-api.ts";

interface Call {
  readonly url: string;
  readonly init: RequestInit | undefined;
}

function fakeApi(answer: () => Promise<Response> | Response) {
  const calls: Call[] = [];
  const api = createRoutinesApi({
    baseUrl: "https://routines.example.test/",
    fetch: async (input, init) => {
      calls.push({ url: String(input), init });
      return answer();
    },
  });
  return { api, calls };
}

const REQUEST = { triggerId: "trig_01Example", token: "fictional-token-wxyz", text: "COCKPIT test" };

describe("createRoutinesApi", () => {
  it("posts the text to the trigger's fire URL with exactly the routines API's headers", async () => {
    const { api, calls } = fakeApi(() => new Response(JSON.stringify({ type: "routine_fire" }), { status: 200 }));

    expect(await api.fire(REQUEST)).toEqual({ ok: true, status: 200 });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("https://routines.example.test/v1/claude_code/routines/trig_01Example/fire");
    expect(calls[0]?.init?.method).toBe("POST");
    expect(calls[0]?.init?.headers).toEqual({
      Authorization: "Bearer fictional-token-wxyz",
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "experimental-cc-routine-2026-04-01",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(calls[0]?.init?.body as string)).toEqual({ text: "COCKPIT test" });
  });

  it("names a 429 with its retry-after, and the other refusals by their status", async () => {
    const limited = fakeApi(() => new Response("{}", { status: 429, headers: { "retry-after": "17" } }));
    expect(await limited.api.fire(REQUEST)).toEqual({ ok: false, status: 429, reason: "rate_limited", retryAfterSeconds: 17 });

    const cases = [
      [401, "unauthorized"],
      [403, "forbidden"],
      [404, "not_found"],
      [400, "rejected"],
      [503, "server_error"],
    ] as const;
    for (const [status, reason] of cases) {
      const { api } = fakeApi(() => new Response("{}", { status }));
      expect(await api.fire(REQUEST)).toEqual({ ok: false, status, reason, retryAfterSeconds: null });
    }
  });

  it("answers unreachable and timeout without the error's text, and never calls with a bent trigger id", async () => {
    const down = fakeApi(() => Promise.reject(new TypeError("fetch failed https://routines.example.test fictional-token-wxyz")));
    expect(await down.api.fire(REQUEST)).toEqual({ ok: false, status: null, reason: "unreachable", retryAfterSeconds: null });

    const slow = fakeApi(() => Promise.reject(new DOMException("The operation timed out.", "TimeoutError")));
    expect(await slow.api.fire(REQUEST)).toEqual({ ok: false, status: null, reason: "timeout", retryAfterSeconds: null });

    const bent = fakeApi(() => new Response("{}", { status: 200 }));
    expect(await bent.api.fire({ ...REQUEST, triggerId: "../../v1/messages" })).toMatchObject({ ok: false, reason: "rejected" });
    expect(bent.calls).toEqual([]);
  });

  it("uses ROUTINES_API_URL when set, else the Anthropic API", () => {
    expect(getRoutinesApiUrl({ ROUTINES_API_URL: "http://127.0.0.1:3101/anthropic" })).toBe("http://127.0.0.1:3101/anthropic");
    expect(getRoutinesApiUrl({ ROUTINES_API_URL: " " })).toBe(DEFAULT_ROUTINES_API_URL);
    expect(getRoutinesApiUrl({})).toBe("https://api.anthropic.com");
  });
});

describe("fire texts", () => {
  it("are exactly the formats of routines/cockpit-command.md: the issue's link, and a short test line", () => {
    expect(formatIssueFireText({ fullName: "example-org/alpha-app", number: 12 })).toBe("COCKPIT command: https://github.com/example-org/alpha-app/issues/12");
    expect(formatIssueFireText({ fullName: "example-org/alpha-app", number: 12 })).toMatch(/^COCKPIT command: https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/issues\/\d+$/);
    expect(TEST_FIRE_TEXT).toBe("COCKPIT test: reply in this chat that the test arrived; change nothing.");
    expect(TEST_FIRE_TEXT).toMatch(/^COCKPIT test: [^\n]{1,80}$/);
  });
});
