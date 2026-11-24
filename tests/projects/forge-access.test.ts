import { describe, expect, it } from "vitest";
import { getForgeClient, getForgeClients, readForgeTokens } from "../../src/projects/forge-access.ts";

describe("readForgeTokens", () => {
  it("reads FORGE_TOKEN first, then every extra token once", () => {
    expect(readForgeTokens({ FORGE_TOKEN: " first ", FORGE_EXTRA_TOKENS: "second, third\nfirst  second" })).toEqual(["first", "second", "third"]);
  });

  it("reads no token without FORGE_TOKEN, even with extra tokens", () => {
    expect(readForgeTokens({ FORGE_EXTRA_TOKENS: "second" })).toEqual([]);
    expect(readForgeTokens({ FORGE_TOKEN: "  " })).toEqual([]);
  });

  it("reads FORGE_TOKEN alone when the extra tokens are unset or empty", () => {
    expect(readForgeTokens({ FORGE_TOKEN: "first" })).toEqual(["first"]);
    expect(readForgeTokens({ FORGE_TOKEN: "first", FORGE_EXTRA_TOKENS: " , " })).toEqual(["first"]);
  });
});

describe("getForgeClient", () => {
  it("builds one client per token and no client without FORGE_TOKEN", () => {
    expect(getForgeClients({ FORGE_TOKEN: "first", FORGE_EXTRA_TOKENS: "second" })).toHaveLength(2);
    expect(getForgeClient({})).toBeNull();
    expect(getForgeClient({ FORGE_TOKEN: "first", FORGE_EXTRA_TOKENS: "second" })).not.toBeNull();
  });
});
