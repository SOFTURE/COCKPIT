import { describe, expect, it } from "vitest";
import type { ForgeRead } from "../../src/forge/client.ts";
import { createRepositoryListCache } from "../../src/projects/repository-list-cache.ts";

const FRESH_MS = 5 * 60_000;
const START = new Date("2026-11-23T20:00:00Z");

interface Deferred {
  readonly resolve: (answer: ForgeRead<string[]>) => void;
}

/** A forge list whose answers the test releases one by one, counting the reads. */
function controlledList() {
  const pending: Deferred[] = [];
  let reads = 0;
  return {
    list: () => {
      reads += 1;
      return new Promise<ForgeRead<string[]>>((resolve) => {
        pending.push({ resolve });
      });
    },
    answer: (answer: ForgeRead<string[]>) => {
      const next = pending.shift();
      if (next === undefined) {
        throw new Error("controlledList: no read is waiting for an answer");
      }
      next.resolve(answer);
    },
    readCount: () => reads,
  };
}

function testClock(start: Date) {
  let now = start.getTime();
  return {
    clock: { now: () => new Date(now) },
    advance: (ms: number) => {
      now += ms;
    },
  };
}

function names(...values: string[]): ForgeRead<string[]> {
  return { ok: true, value: values };
}

const FAILED: ForgeRead<string[]> = { ok: false, kind: "unavailable" };

describe("createRepositoryListCache", () => {
  it("reads the forge on the first read and serves the list without a forge call while it is fresh", async () => {
    const forge = controlledList();
    const time = testClock(START);
    const cache = createRepositoryListCache({ list: forge.list, clock: time.clock, freshMs: FRESH_MS });
    const first = cache.read();
    forge.answer(names("example-org/alpha-app"));
    expect(await first).toEqual({ names: ["example-org/alpha-app"], readAt: START });
    time.advance(FRESH_MS - 1);
    expect(await cache.read()).toEqual({ names: ["example-org/alpha-app"], readAt: START });
    expect(forge.readCount()).toBe(1);
  });

  it("serves a stale list at once and refreshes it with one background read", async () => {
    const forge = controlledList();
    const time = testClock(START);
    const cache = createRepositoryListCache({ list: forge.list, clock: time.clock, freshMs: FRESH_MS });
    const first = cache.read();
    forge.answer(names("example-org/alpha-app"));
    await first;
    time.advance(FRESH_MS);
    expect(await cache.read()).toEqual({ names: ["example-org/alpha-app"], readAt: START });
    expect(await cache.read()).toEqual({ names: ["example-org/alpha-app"], readAt: START });
    expect(forge.readCount()).toBe(2);
    forge.answer(names("example-org/alpha-app", "example-org/beta-app"));
    await cache.settled();
    expect(await cache.read()).toEqual({ names: ["example-org/alpha-app", "example-org/beta-app"], readAt: new Date(START.getTime() + FRESH_MS) });
    expect(forge.readCount()).toBe(2);
  });

  it("shares one forge read between reads that arrive while it runs", async () => {
    const forge = controlledList();
    const cache = createRepositoryListCache({ list: forge.list, clock: testClock(START).clock, freshMs: FRESH_MS });
    const reads = [cache.read(), cache.read(), cache.read()];
    forge.answer(names("example-org/alpha-app"));
    const lists = await Promise.all(reads);
    expect(lists.every((list) => list?.names.length === 1)).toBe(true);
    expect(forge.readCount()).toBe(1);
  });

  it("keeps the last good list when a refresh fails, and has none when the first read fails", async () => {
    const forge = controlledList();
    const time = testClock(START);
    const cache = createRepositoryListCache({ list: forge.list, clock: time.clock, freshMs: FRESH_MS });
    const failedFirst = cache.read();
    forge.answer(FAILED);
    expect(await failedFirst).toBeNull();
    const second = cache.read();
    forge.answer(names("example-org/alpha-app"));
    await second;
    const refreshed = cache.refresh();
    forge.answer(FAILED);
    expect(await refreshed).toEqual({ names: ["example-org/alpha-app"], readAt: START });
  });

  it("rereads the forge on refresh even while the list is fresh", async () => {
    const forge = controlledList();
    const time = testClock(START);
    const cache = createRepositoryListCache({ list: forge.list, clock: time.clock, freshMs: FRESH_MS });
    const first = cache.read();
    forge.answer(names("example-org/alpha-app"));
    await first;
    time.advance(1_000);
    const refreshed = cache.refresh();
    forge.answer(names("example-org/beta-app"));
    expect(await refreshed).toEqual({ names: ["example-org/beta-app"], readAt: new Date(START.getTime() + 1_000) });
    expect(forge.readCount()).toBe(2);
  });
});
