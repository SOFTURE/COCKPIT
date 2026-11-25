import { describe, expect, it } from "vitest";
import { getDeployResultLook, getVerifyLook } from "../../src/adapters/deploy/deploy-step-looks.ts";

describe("deploy step looks", () => {
  it("shows a passed deploy and a passed verification as success", () => {
    expect(getDeployResultLook("passed").tone).toBe("success");
    expect(getVerifyLook("passed").tone).toBe("success");
  });

  it("shows a skipped verification as needing attention", () => {
    expect(getVerifyLook("skipped").tone).toBe("warning");
  });

  it("shows a failed deploy and a failed verification as danger", () => {
    expect(getDeployResultLook("failed").tone).toBe("danger");
    expect(getVerifyLook("failed").tone).toBe("danger");
  });

  it("shows a running deploy with a turning icon and anything running, cancelled or unreported as muted", () => {
    expect(getDeployResultLook("running")).toMatchObject({ tone: "muted", isSpinning: true });
    expect(getDeployResultLook("cancelled").tone).toBe("muted");
    expect(getVerifyLook("cancelled").tone).toBe("muted");
    expect(getVerifyLook(null).tone).toBe("muted");
  });
});
