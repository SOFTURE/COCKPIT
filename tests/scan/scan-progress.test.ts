import { describe, expect, it } from "vitest";
import { toScanProgress, toScanProgressView } from "../../src/scan/scan-progress.ts";

const EARLIER = new Date("2026-11-24T10:00:00Z");
const LATER = new Date("2026-11-24T11:30:00Z");

describe("toScanProgress", () => {
  it("is idle with the newest read time when no scan waits or runs", () => {
    expect(toScanProgress({ jobs: [{ status: "succeeded", progress: null }], readTimes: [EARLIER, LATER] })).toEqual({
      kind: "idle",
      lastReadAt: LATER,
    });
  });

  it("is idle without a read time when no project was read yet", () => {
    expect(toScanProgress({ jobs: [], readTimes: [] })).toEqual({ kind: "idle", lastReadAt: null });
  });

  it("is queued while a scan waits and none runs", () => {
    expect(toScanProgress({ jobs: [{ status: "pending", progress: null }], readTimes: [EARLIER] })).toEqual({
      kind: "queued",
      lastReadAt: EARLIER,
    });
  });

  it("is running with the reported count, ahead of a follow-up scan that waits", () => {
    const jobs = [
      { status: "pending", progress: null },
      { status: "running", progress: { step: "scan.projects", done: 2, total: 5 } },
    ] as const;
    expect(toScanProgress({ jobs, readTimes: [EARLIER] })).toEqual({ kind: "running", done: 2, total: 5, lastReadAt: EARLIER });
  });

  it("is running without a count before the scan reported one", () => {
    expect(toScanProgress({ jobs: [{ status: "running", progress: null }], readTimes: [] })).toEqual({
      kind: "running",
      done: null,
      total: null,
      lastReadAt: null,
    });
  });

  it("ignores a progress of another step", () => {
    expect(toScanProgress({ jobs: [{ status: "running", progress: { step: "other.step", done: 1, total: 2 } }], readTimes: [] })).toMatchObject({
      done: null,
      total: null,
    });
  });
});

describe("toScanProgressView", () => {
  const formatTime = (date: Date) => date.toISOString();

  it("writes the newest read time for the owner", () => {
    expect(toScanProgressView({ kind: "idle", lastReadAt: LATER }, formatTime)).toEqual({ kind: "idle", lastRead: LATER.toISOString() });
  });

  it("keeps a running scan's count and an unknown read time", () => {
    expect(toScanProgressView({ kind: "running", done: 1, total: 4, lastReadAt: null }, formatTime)).toEqual({
      kind: "running",
      done: 1,
      total: 4,
      lastRead: null,
    });
  });
});
