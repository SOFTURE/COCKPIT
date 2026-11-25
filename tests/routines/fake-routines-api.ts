// A fake routines API for the unit tests (CT-10): answers per trigger id from a script, else 200, and records each call.
import type { FireRequest, FireResult, RoutinesApi } from "../../src/routines/routines-api.ts";

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
