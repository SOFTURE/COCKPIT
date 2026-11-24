import { describe, expect, it } from "vitest";
import { getDeployResultLook, getVerifyLook } from "../../src/adapters/deploy/deploy-step-looks.ts";

describe("deploy step looks", () => {
  it("shows a passed deploy and a passed verification in green", () => {
    expect(getDeployResultLook("passed").color).toBe("green");
    expect(getVerifyLook("passed").color).toBe("green");
  });

  it("shows a skipped verification in amber", () => {
    expect(getVerifyLook("skipped").color).toBe("yellow");
  });

  it("shows a failed deploy and a failed verification in red", () => {
    expect(getDeployResultLook("failed").color).toBe("red");
    expect(getVerifyLook("failed").color).toBe("red");
  });

  it("shows a running deploy in blue and anything cancelled or unreported in grey", () => {
    expect(getDeployResultLook("running").color).toBe("blue");
    expect(getDeployResultLook("cancelled").color).toBe("gray");
    expect(getVerifyLook("cancelled").color).toBe("gray");
    expect(getVerifyLook(null).color).toBe("gray");
  });
});
