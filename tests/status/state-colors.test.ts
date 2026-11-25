import { describe, expect, it } from "vitest";
import { getDeployResultLook, getVerifyLook } from "../../src/adapters/deploy/deploy-step-looks.ts";
import { STATUS_LOOKS } from "../../src/status/status-look.ts";
import { getDeployResultTone, getDoctorTone, getHealthTone, getPackageVersionTone, getRunTone } from "../../src/status/state-colors.ts";

const RUN = { kind: "run", url: "https://forge.example.test/run/1", at: "2026-11-24T10:00:00Z", pullRequest: null } as const;

describe("result tones (the one colour map of CT-18)", () => {
  it("shows a passed run as success, a failed one as danger, and a running, cancelled or missing one as muted", () => {
    expect(getRunTone({ ...RUN, result: "passed" })).toBe("success");
    expect(getRunTone({ ...RUN, result: "failed" })).toBe("danger");
    expect(getRunTone({ ...RUN, result: "running" })).toBe("muted");
    expect(getRunTone({ ...RUN, result: "cancelled" })).toBe("muted");
    expect(getRunTone({ kind: "none" })).toBe("muted");
    expect(getRunTone({ kind: "not_read" })).toBe("muted");
    expect(getRunTone({ kind: "not_readable" })).toBe("muted");
  });

  it("shows an OK doctor as success, a failing one as danger, and a pending or unknown one as muted", () => {
    expect(getDoctorTone({ kind: "ok", url: null })).toBe("success");
    expect(getDoctorTone({ kind: "failing", url: null, codes: null })).toBe("danger");
    expect(getDoctorTone({ kind: "pending", url: null })).toBe("muted");
    expect(getDoctorTone({ kind: "missing" })).toBe("muted");
    expect(getDoctorTone({ kind: "not_read" })).toBe("muted");
  });

  it("shows a healthy project as success, an unhealthy one as danger and an unknown health as muted", () => {
    expect(getHealthTone("healthy")).toBe("success");
    expect(getHealthTone("unhealthy")).toBe("danger");
    expect(getHealthTone("unknown")).toBe("muted");
  });

  it("shows a current package as success and one behind as warning", () => {
    expect(getPackageVersionTone("current")).toBe("success");
    expect(getPackageVersionTone("behind")).toBe("warning");
  });

  it("shows a passed deploy as success, a failed one as danger, and a running or cancelled one as muted", () => {
    expect(getDeployResultTone("passed")).toBe("success");
    expect(getDeployResultTone("failed")).toBe("danger");
    expect(getDeployResultTone("running")).toBe("muted");
    expect(getDeployResultTone("cancelled")).toBe("muted");
  });

  it("gives a deploy's steps the same tones: a skipped verification needs attention, an unreported one is muted", () => {
    expect(getDeployResultLook("running").tone).toBe("muted");
    expect(getVerifyLook("passed").tone).toBe("success");
    expect(getVerifyLook("failed").tone).toBe("danger");
    expect(getVerifyLook("skipped").tone).toBe("warning");
    expect(getVerifyLook("cancelled").tone).toBe("muted");
    expect(getVerifyLook(null).tone).toBe("muted");
  });

  it("shows an idle project's moon in blue", () => {
    expect(STATUS_LOOKS.idle.color).toBe("blue");
  });
});
