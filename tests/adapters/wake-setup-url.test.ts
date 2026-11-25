import { describe, expect, it } from "vitest";
import { WAKE_SETUP_URL } from "../../src/adapters/wake/owner-word-wake.ts";

describe("WAKE_SETUP_URL", () => {
  it("opens the setup steps of the wake routine on the skills repository's default branch", () => {
    expect(WAKE_SETUP_URL).toBe("https://github.com/SOFTURE/SKILLS/blob/master/routines/cockpit-wake.md#setting-it-up");
  });
});
