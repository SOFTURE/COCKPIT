import { describe, expect, it } from "vitest";
import { pickTab, tabHref } from "../../src/shell/pick-tab.ts";

const KEYS = ["new", "sent"] as const;

describe("pickTab", () => {
  it("shows the requested tab when it is one of the tabs", () => {
    expect(pickTab(KEYS, "sent", "new")).toBe("sent");
  });

  it("falls back when nothing is requested", () => {
    expect(pickTab(KEYS, undefined, "new")).toBe("new");
  });

  it("falls back when the requested tab is unknown", () => {
    expect(pickTab(KEYS, "archive", "new")).toBe("new");
  });

  it("falls back on an empty request", () => {
    expect(pickTab(KEYS, "", "sent")).toBe("sent");
  });
});

describe("tabHref", () => {
  it("puts the tab key in the given query parameter", () => {
    expect(tabHref("/broadcast", "sent")).toBe("/broadcast?tab=sent");
  });

  it("encodes a key that is not address-safe", () => {
    expect(tabHref("/inbox", "example-org/alpha app", "project")).toBe("/inbox?project=example-org%2Falpha%20app");
  });
});
