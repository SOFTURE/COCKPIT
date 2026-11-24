import { describe, expect, it } from "vitest";
import { isActivePath, NAVIGATION } from "../../src/shell/navigation.ts";

describe("the shell navigation", () => {
  it("lists Inbox, Broadcast, Projects, Deploys and Settings in that order", () => {
    expect(NAVIGATION.map((item) => item.href)).toEqual(["/inbox", "/broadcast", "/projects", "/deploys", "/settings"]);
  });

  it("marks a destination and the pages below it as active, and nothing that only shares a prefix", () => {
    expect(isActivePath("/projects", "/projects")).toBe(true);
    expect(isActivePath("/projects/alpha", "/projects")).toBe(true);
    expect(isActivePath("/projectsx", "/projects")).toBe(false);
    expect(isActivePath("/inbox", "/settings")).toBe(false);
  });
});
