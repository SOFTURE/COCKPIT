import { describe, expect, it } from "vitest";
import { DEFAULT_DIGEST_AT, getDigestAt, getDigestRecipients, getDigestSettings } from "../../src/digest/digest-settings.ts";

describe("the digest settings", () => {
  it("send at 08:00 by default and at a valid local time when one is set", () => {
    expect(getDigestAt(undefined)).toBe(DEFAULT_DIGEST_AT);
    expect(getDigestAt(" ")).toBe("08:00");
    expect(getDigestAt("18:30")).toBe("18:30");
  });

  it("stop the app at start for a malformed time", () => {
    for (const value of ["8:00", "24:00", "07:60", "noon"]) {
      expect(() => getDigestAt(value)).toThrow("DIGEST_AT must be a local time of day as HH:MM");
    }
  });

  it("read comma-separated recipients once each", () => {
    expect(getDigestRecipients(" owner@example.com, ,partner@example.com,owner@example.com ")).toEqual(["owner@example.com", "partner@example.com"]);
    expect(getDigestRecipients(undefined)).toEqual([]);
  });

  it("are configured only with a recipient and a sender", () => {
    expect(getDigestSettings({ DIGEST_RECIPIENTS: "owner@example.com", MAIL_FROM: "COCKPIT <digest@example.com>" })).toEqual({ recipients: ["owner@example.com"] });
    expect(getDigestSettings({ DIGEST_RECIPIENTS: "owner@example.com" })).toBeNull();
    expect(getDigestSettings({ MAIL_FROM: "COCKPIT <digest@example.com>" })).toBeNull();
  });
});
