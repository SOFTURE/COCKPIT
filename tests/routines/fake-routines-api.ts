// A fake Claude Code routines API for the unit tests (CT-10): answers per trigger id from a script, else 200, and
// records each call. `createFakeProviders` registers the Claude Code provider over it (CT-20).
import { createClaudeCodeProvider } from "../../src/routines/providers/claude-code/provider.ts";
import type { FireRequest, RoutinesApi } from "../../src/routines/providers/claude-code/routines-api.ts";
import { createRoutineProviders, type FireResult, type RoutineProvider, type RoutineProviders } from "../../src/routines/providers/contract.ts";

export interface FakeRoutinesApi extends RoutinesApi {
  readonly calls: FireRequest[];
  /** Answers queued for one trigger id, used in order; an empty queue answers 200. */
  script(triggerId: string, ...results: FireResult[]): void;
}

export function createFakeRoutinesApi(): FakeRoutinesApi {
  const calls: FireRequest[] = [];
  const scripts = new Map<string, FireResult[]>();
  return {
    calls,
    script: (triggerId, ...results) => {
      scripts.set(triggerId, [...(scripts.get(triggerId) ?? []), ...results]);
    },
    fire: (request) => {
      calls.push(request);
      return Promise.resolve(scripts.get(request.triggerId)?.shift() ?? { ok: true, status: 200 });
    },
  };
}

/** The registry the tests use: the Claude Code provider over the fake API, plus any provider a test adds. */
export function createFakeProviders(api: RoutinesApi, ...extra: RoutineProvider[]): RoutineProviders {
  return createRoutineProviders([createClaudeCodeProvider(api), ...extra]);
}
