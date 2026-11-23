import { describe, expect, it } from "vitest";
import { isActivePath, NAVIGATION } from "../../src/shell/navigation.ts";

describe("the shell navigation", () => {
  it("lists Inbox, Projects and Settings in that order", () => {
    expect(NAVIGATION.map((item) => item.href)).toEqual(["/inbox", "/projects", "/settings"]);
  });

  it("marks a destination and the pages below it as active, and nothing that only shares a prefix", () => {
    expect(isActivePath("/projects", "/projects")).toBe(true);
    expect(isActivePath("/projects/alpha", "/projects")).toBe(true);
    expect(isActivePath("/projectsx", "/projects")).toBe(false);
    expect(isActivePath("/inbox", "/settings")).toBe(false);
  });
});
