import { describe, expect, it } from "vitest";
import { en } from "../../messages/en.ts";
import { fillMessage } from "../../messages/index.ts";
import { pl } from "../../messages/pl.ts";
import { describeMode, describeOrder } from "../../src/roadmap/describe-order.ts";

const copy = pl.roadmapView;

describe("describeOrder", () => {
  it("translates the known labels and the plain values, keeping what follows them", () => {
    expect(describeOrder({ label: "Push main branch", note: null, text: "after each item (one PR per change)" }, copy)).toEqual({
      label: copy.orderLabels["Push main branch"],
      note: null,
      text: `${copy.orderValues.afterEachItem} (one PR per change)`,
    });
    expect(describeOrder({ label: "Parallelism", note: null, text: "up to 1 at once" }, copy).text).toBe(fillMessage(copy.orderValues.upTo, { count: 1 }));
    expect(describeOrder({ label: "Release", note: null, text: "no" }, copy)).toEqual({ label: copy.orderLabels.Release, note: null, text: copy.orderValues.no });
    expect(describeOrder({ label: "Release", note: null, text: "after LT-3" }, copy).text).toBe(`${copy.orderValues.afterItem}LT-3`);
    expect(describeOrder({ label: "Archive roadmap", note: null, text: "at the end" }, copy).text).toBe(copy.orderValues.atTheEnd);
    // The labels and values differ from the English ones, so the translation is really applied.
    expect(copy.orderLabels["Owner at the keyboard"]).not.toBe("Owner at the keyboard");
    expect(copy.orderValues.no).not.toBe("no");
  });

  it("leaves out a mode note that repeats the label, words any other mode note, keeps other notes and unknown values", () => {
    expect(describeOrder({ label: "Owner at the keyboard", note: "`Mode: owner`", text: "LT-1, LT-2" }, copy)).toEqual({
      label: copy.orderLabels["Owner at the keyboard"],
      note: null,
      text: "LT-1, LT-2",
    });
    expect(describeOrder({ label: "Owner at the keyboard", note: "`Mode: autonomous`", text: "LT-3" }, copy).note).toBe(fillMessage(copy.modeNote, { mode: copy.modes.autonomous }));
    expect(describeOrder({ label: "Release", note: "Mode: manual", text: "no" }, copy).note).toBe(fillMessage(copy.modeNote, { mode: copy.modes.manual }));
    expect(describeOrder({ label: "Release", note: "`Mode: pairing`", text: "no" }, copy).note).toBe(fillMessage(copy.modeNote, { mode: "pairing" }));
    expect(describeOrder({ label: "Release", note: "`npm run release`", text: "no" }, copy).note).toBe("`npm run release`");
    expect(describeOrder({ label: "Release", note: "`Mode: owner`", text: "no" }, en.roadmapView).note).toBe("Mode: owner");
    expect(describeOrder({ label: "Release", note: null, text: "nothing to ship" }, copy).text).toBe("nothing to ship");
    expect(describeOrder({ label: "Start", note: null, text: "after the beta feedback" }, copy).text).toBe("after the beta feedback");
  });

  it("words a known mode in the panel's language and leaves an unknown one as written", () => {
    expect(describeMode("autonomous", copy)).toBe(copy.modes.autonomous);
    expect(copy.modes.autonomous).not.toBe("autonomous");
    expect(describeMode("owner", copy)).toBe(copy.modes.owner);
    expect(describeMode("pairing", copy)).toBe("pairing");
    expect(describeMode("constructor", en.roadmapView)).toBe("constructor");
  });

  it("shows an unknown label as written", () => {
    expect(describeOrder({ label: "Freeze", note: null, text: "no" }, copy)).toEqual({ label: "Freeze", note: null, text: copy.orderValues.no });
    expect(describeOrder({ label: "constructor", note: null, text: "x" }, en.roadmapView).label).toBe("constructor");
  });
});
