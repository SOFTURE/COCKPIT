import { describe, expect, it } from "vitest";
import { parseTriggerId } from "../../../src/routines/providers/claude-code/trigger-id.ts";

describe("parseTriggerId", () => {
  it("keeps an id and takes the id from a fire URL", () => {
    expect(parseTriggerId(" trig_01AbC-x ")).toBe("trig_01AbC-x");
    expect(parseTriggerId("https://api.anthropic.com/v1/claude_code/routines/trig_01AbC/fire")).toBe("trig_01AbC");
    expect(parseTriggerId("https://api.anthropic.com/v1/claude_code/routines/trig_01AbC/fire/")).toBe("trig_01AbC");
  });

  it("refuses anything else", () => {
    for (const input of [
      "",
      "trig 01",
      "https://api.anthropic.com/v1/claude_code/routines/trig_01/other",
      "https://api.anthropic.com/v1/claude_code/routines/../fire",
      "https://api.anthropic.com/v1/claude_code/routines/trig%2F01/fire",
      "ftp://api.anthropic.com/v1/claude_code/routines/trig_01/fire",
      "x".repeat(101),
    ]) {
      expect(parseTriggerId(input)).toBeNull();
    }
  });
});
