import { describe, expect, it } from "vitest";
import { getAppLocale, getTerminalLocale, SUPPORTED_LOCALES } from "../../src/locale/app-locale.ts";

describe("getAppLocale", () => {
  it("reads English when the setting is missing or empty", () => {
    expect(getAppLocale(undefined)).toBe("en");
    expect(getAppLocale("")).toBe("en");
    expect(getAppLocale("  ")).toBe("en");
  });

  it("reads each supported locale, ignoring case and spaces", () => {
    expect(getAppLocale("pl")).toBe("pl");
    expect(getAppLocale(" PL ")).toBe("pl");
    expect(getAppLocale("en")).toBe("en");
  });

  it("reads a regional tag as its language", () => {
    expect(getAppLocale("pl-PL")).toBe("pl");
    expect(getAppLocale("pl_PL.UTF-8")).toBe("pl");
  });

  it("falls back to English for a locale COCKPIT has no copy for", () => {
    expect(getAppLocale("de")).toBe("en");
    expect(getAppLocale("not a locale")).toBe("en");
  });

  it("supports exactly English and Polish", () => {
    expect(SUPPORTED_LOCALES).toEqual(["en", "pl"]);
  });
});

describe("getTerminalLocale", () => {
  it("prefers COCKPIT_LOCALE, then LC_ALL, then LANG", () => {
    expect(getTerminalLocale({ COCKPIT_LOCALE: "pl", LANG: "en_US.UTF-8" })).toBe("pl");
    expect(getTerminalLocale({ LC_ALL: "pl_PL.UTF-8", LANG: "en_US.UTF-8" })).toBe("pl");
    expect(getTerminalLocale({ LANG: "pl_PL.UTF-8" })).toBe("pl");
  });

  it("reads English when nothing names a supported language", () => {
    expect(getTerminalLocale({})).toBe("en");
    expect(getTerminalLocale({ LANG: "C.UTF-8" })).toBe("en");
    expect(getTerminalLocale({ COCKPIT_LOCALE: "de", LANG: "pl_PL.UTF-8" })).toBe("en");
  });
});
