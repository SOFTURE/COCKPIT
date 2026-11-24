import { describe, expect, it } from "vitest";
import { STATUS_LOOKS } from "../../src/status/status-look.ts";
import { getDeployResultColor, getDoctorColor, getHealthColor, getPackageVersionColor, getRunColor } from "../../src/status/state-colors.ts";

const RUN = { kind: "run", url: "https://forge.example.test/run/1", at: "2026-11-24T10:00:00Z", pullRequest: null } as const;

describe("state colours", () => {
  it("shows a passed run green, a failed one red, a running one blue and a cancelled or missing one grey", () => {
    expect(getRunColor({ ...RUN, result: "passed" })).toBe("green");
    expect(getRunColor({ ...RUN, result: "failed" })).toBe("red");
    expect(getRunColor({ ...RUN, result: "running" })).toBe("blue");
    expect(getRunColor({ ...RUN, result: "cancelled" })).toBe("gray");
    expect(getRunColor({ kind: "none" })).toBe("gray");
    expect(getRunColor({ kind: "not_read" })).toBe("gray");
    expect(getRunColor({ kind: "not_readable" })).toBe("gray");
  });

  it("shows an OK doctor green, a failing one red, a pending one blue and an unknown one grey", () => {
    expect(getDoctorColor({ kind: "ok", url: null })).toBe("green");
    expect(getDoctorColor({ kind: "failing", url: null, codes: null })).toBe("red");
    expect(getDoctorColor({ kind: "pending", url: null })).toBe("blue");
    expect(getDoctorColor({ kind: "missing" })).toBe("gray");
    expect(getDoctorColor({ kind: "not_read" })).toBe("gray");
  });

  it("shows a healthy project green, an unhealthy one red and an unknown health grey", () => {
    expect(getHealthColor("healthy")).toBe("green");
    expect(getHealthColor("unhealthy")).toBe("red");
    expect(getHealthColor("unknown")).toBe("gray");
  });

  it("shows a current package green and one behind amber", () => {
    expect(getPackageVersionColor("current")).toBe("green");
    expect(getPackageVersionColor("behind")).toBe("orange");
  });

  it("shows a passed deploy green, a failed one red, a running one blue and a cancelled one grey", () => {
    expect(getDeployResultColor("passed")).toBe("green");
    expect(getDeployResultColor("failed")).toBe("red");
    expect(getDeployResultColor("running")).toBe("blue");
    expect(getDeployResultColor("cancelled")).toBe("gray");
  });

  it("shows an idle project's moon in blue", () => {
    expect(STATUS_LOOKS.idle.color).toBe("blue");
  });
});
