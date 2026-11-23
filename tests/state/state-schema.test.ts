import { describe, expect, it } from "vitest";
import { parseProjectState } from "../../src/state/state-schema.ts";
import { createStateFixture } from "../support/state-fixture.ts";

describe("parseProjectState", () => {
  it("reads a version 2 state with its owner-queue entry ids", () => {
    const result = parseProjectState(createStateFixture());
    expect(result.ok && result.value.owner_queue.map((entry) => entry.id)).toEqual(["oq-1a2b3c"]);
  });

  it("tolerates keys a newer writer adds", () => {
    expect(parseProjectState({ ...createStateFixture(), extra_section: [] }).ok).toBe(true);
  });

  it("calls a version 1 state too old", () => {
    expect(parseProjectState({ ...createStateFixture(), schema_version: 1 })).toEqual({ ok: false, error: "state.too_old" });
  });

  it.each([
    ["a missing owner queue", { ...createStateFixture(), owner_queue: undefined }],
    ["an entry without id", createStateFixture({ owner_queue: [{ kind: "word", source: "x", item: null, since: null, text: "t" } as never] })],
    ["an unknown version", { ...createStateFixture(), schema_version: 3 }],
    ["not an object", "state"],
    ["null", null],
  ])("refuses %s as invalid", (_label, value) => {
    expect(parseProjectState(value)).toEqual({ ok: false, error: "state.invalid" });
  });
});
