import { describe, expect, it } from "vitest";
import { getAnswererName, getPublicAnswererName } from "../../src/team/answerer-name.ts";

describe("getAnswererName", () => {
  it("uses the display name when the account has one", () => {
    expect(getAnswererName({ email: "ada@example.com", displayName: "  Ada Example " })).toBe("Ada Example");
  });

  it("falls back to the email when the display name is missing or blank", () => {
    expect(getAnswererName({ email: "ada@example.com", displayName: null })).toBe("ada@example.com");
    expect(getAnswererName({ email: "ada@example.com", displayName: "   " })).toBe("ada@example.com");
    expect(getAnswererName({ email: "ada@example.com" })).toBe("ada@example.com");
  });
});

describe("getPublicAnswererName", () => {
  it("keeps a display name as it is", () => {
    expect(getPublicAnswererName("Ada Example")).toBe("Ada Example");
  });

  it("turns an email into the part before @", () => {
    expect(getPublicAnswererName("ada.example@example.com")).toBe("ada.example");
  });

  it("keeps a name that only starts with @", () => {
    expect(getPublicAnswererName("@ada")).toBe("@ada");
  });
});
