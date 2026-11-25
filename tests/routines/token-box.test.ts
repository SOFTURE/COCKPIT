import { describe, expect, it } from "vitest";
import { createTokenBox, getTokenLast4, getTokenSecret, MIN_SECRET_LENGTH } from "../../src/routines/token-box.ts";

const SECRET = "fictional-routine-token-secret-0001";
const TOKEN = "fictional-routine-token-abcd";

describe("token box", () => {
  it("seals a token so its text never appears, and opens it again with the same secret", () => {
    const box = createTokenBox(SECRET);
    const sealed = box.seal(TOKEN);

    expect(sealed).toMatch(/^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    expect(sealed).not.toContain(TOKEN);
    expect(box.seal(TOKEN)).not.toBe(sealed);
    expect(box.open(sealed)).toBe(TOKEN);
  });

  it("opens nothing under another secret, after a change, or in a foreign shape", () => {
    const sealed = createTokenBox(SECRET).seal(TOKEN);
    const [version, iv, tag, ciphertext] = sealed.split(".");
    const flipped = `${ciphertext?.startsWith("A") ? "B" : "A"}${ciphertext?.slice(1) ?? ""}`;

    expect(createTokenBox("another-fictional-secret-of-32-chars").open(sealed)).toBeNull();
    expect(createTokenBox(SECRET).open([version, iv, tag, flipped].join("."))).toBeNull();
    expect(createTokenBox(SECRET).open(`v2.${String(iv)}.${String(tag)}.${String(ciphertext)}`)).toBeNull();
    expect(createTokenBox(SECRET).open("plain-token")).toBeNull();
  });

  it("reads the secret only when it is long enough, and refuses a short one", () => {
    expect(getTokenSecret({ ROUTINE_TOKEN_SECRET: ` ${SECRET} ` })).toBe(SECRET);
    expect(getTokenSecret({ ROUTINE_TOKEN_SECRET: "x".repeat(MIN_SECRET_LENGTH - 1) })).toBeNull();
    expect(getTokenSecret({})).toBeNull();
    expect(() => createTokenBox("short")).toThrow("at least 32 characters");
  });

  it("shows only the last four characters", () => {
    expect(getTokenLast4(TOKEN)).toBe("abcd");
  });
});
