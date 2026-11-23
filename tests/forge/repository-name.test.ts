import { describe, expect, it } from "vitest";
import { parseRepositoryName } from "../../src/forge/repository-name.ts";

describe("parseRepositoryName", () => {
  it("accepts owner/name, trims it and keys it lower-cased", () => {
    expect(parseRepositoryName("  Example-Org/Alpha.app  ")).toEqual({
      ok: true,
      value: { owner: "Example-Org", name: "Alpha.app", fullName: "Example-Org/Alpha.app", key: "example-org/alpha.app" },
    });
  });

  it.each(["", "alpha", "a/b/c", "/alpha", "owner/", "-owner/alpha", "own--er/alpha", "owner/..", "owner/al pha", "https://example.com/a/b"])(
    "refuses %j",
    (input) => {
      expect(parseRepositoryName(input)).toEqual({ ok: false, error: "projects.name_invalid" });
    },
  );
});
