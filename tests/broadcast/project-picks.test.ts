// The picking rules of the grouped project picker (CT-34): a group's checkbox selects or clears that group only, reads
// all, some or none, and the totals count every group.
import { describe, expect, it } from "vitest";
import { countPicked, getGroupPickState, setPicked } from "../../src/broadcast/project-picks.ts";

const CEDAR = ["cedar-lane/cedar-app", "cedar-lane/cedar-docs"];
const BIRCH = ["birch-hall/birch-app"];
const LOOSE = ["example-org/loose-app"];
const EVERY = [...CEDAR, ...BIRCH, ...LOOSE];

describe("setPicked", () => {
  it("selects a group's projects only", () => {
    const picked = setPicked(new Set(BIRCH), CEDAR, true);
    expect([...picked].sort()).toEqual([...CEDAR, ...BIRCH].sort());
  });

  it("clears a group's projects only", () => {
    const picked = setPicked(new Set(EVERY), CEDAR, false);
    expect([...picked].sort()).toEqual([...BIRCH, ...LOOSE].sort());
  });

  it("toggles one project and leaves the given set as it was", () => {
    const before = new Set(EVERY);
    const after = setPicked(before, [BIRCH[0]!], false); // BIRCH has one key; the fixture is fixed above.
    expect(countPicked(EVERY, after)).toBe(3);
    expect(before.size).toBe(4);
  });

  it("picks and clears every project across groups", () => {
    expect(countPicked(EVERY, setPicked(new Set(), EVERY, true))).toBe(4);
    expect(countPicked(EVERY, setPicked(new Set(EVERY), EVERY, false))).toBe(0);
  });
});

describe("getGroupPickState", () => {
  it("reads all when every project of the group is picked", () => {
    expect(getGroupPickState(CEDAR, new Set(CEDAR))).toBe("all");
  });

  it("reads some when part of the group is picked", () => {
    expect(getGroupPickState(CEDAR, new Set([CEDAR[0]!, ...BIRCH]))).toBe("some"); // CEDAR has two keys.
  });

  it("reads none when no project of the group is picked, whatever other groups hold", () => {
    expect(getGroupPickState(CEDAR, new Set([...BIRCH, ...LOOSE]))).toBe("none");
  });

  it("reads none for an empty group", () => {
    expect(getGroupPickState([], new Set(EVERY))).toBe("none");
  });
});

describe("countPicked", () => {
  it("counts picks across every group", () => {
    expect(countPicked(EVERY, new Set([CEDAR[1]!, ...LOOSE]))).toBe(2); // CEDAR has two keys.
  });

  it("never counts a picked key that is not shown", () => {
    expect(countPicked(EVERY, new Set(["example-org/gone-app", ...BIRCH]))).toBe(1);
  });
});
