import { describe, expect, it } from "vitest";
import { getIssueLink } from "../../src/adapters/packages/issue-link.ts";
import { PACKAGES_ADAPTER_ID } from "../../src/adapters/packages/packages-state.ts";
import { getPackagesView } from "../../src/adapters/packages/packages-view.ts";
import { compareVersions, isBehind } from "../../src/adapters/packages/versions.ts";
import type { StoredAdapterRead } from "../../modules/adapters/reads.ts";

const READ_AT = new Date("2026-11-24T08:00:00Z");
const KEY = "example-org/kappa-app";
const STATE = {
  update: { kind: "none" },
  held: [],
  packages: [{ name: "@softure-ai/ui", locked: "0.3.11", latest: "0.4.0" }],
};

const stored = (read: Partial<StoredAdapterRead> & Pick<StoredAdapterRead, "status">): StoredAdapterRead =>
  ({ key: KEY, adapter: PACKAGES_ADAPTER_ID, readAt: READ_AT, ...read }) as StoredAdapterRead;

describe("the packages view", () => {
  it("shows the stored state", () => {
    expect(getPackagesView([stored({ status: "value", value: STATE })], KEY)).toEqual({ kind: "state", state: STATE });
  });

  it("shows nothing for a project never read, absent, or read by another adapter", () => {
    expect(getPackagesView([], KEY)).toEqual({ kind: "none" });
    expect(getPackagesView([stored({ status: "absent" })], KEY)).toEqual({ kind: "none" });
    expect(getPackagesView([{ ...stored({ status: "value", value: STATE }), adapter: "deploy" }], KEY)).toEqual({ kind: "none" });
  });

  it("shows unknown with a known reason, other for any other reason or a stored value of another shape", () => {
    expect(getPackagesView([stored({ status: "unknown", reason: "manifest_unreadable" })], KEY)).toEqual({ kind: "unknown", reason: "manifest_unreadable" });
    expect(getPackagesView([stored({ status: "unknown", reason: "gone" })], KEY)).toEqual({ kind: "unknown", reason: "other" });
    expect(getPackagesView([stored({ status: "value", value: { update: "merged" } })], KEY)).toEqual({ kind: "unknown", reason: "other" });
  });
});

describe("versions", () => {
  it("orders versions as numbers, a prerelease below its release", () => {
    expect(compareVersions("0.2.9", "0.2.10")).toBeLessThan(0);
    expect(compareVersions("1.0.0", "0.99.99")).toBeGreaterThan(0);
    expect(compareVersions("1.0.0-beta.2", "1.0.0")).toBeLessThan(0);
    expect(compareVersions("1.0.0-beta.10", "1.0.0-beta.2")).toBeGreaterThan(0);
    expect(compareVersions("v1.2.3", "1.2.3")).toBe(0);
    expect(compareVersions("latest", "1.2.3")).toBeNull();
  });

  it("marks a locked version behind only when both are known and it is older", () => {
    expect(isBehind("0.35.0", "0.36.0")).toBe(true);
    expect(isBehind("0.36.0", "0.36.0")).toBe(false);
    expect(isBehind("0.37.0", "0.36.0")).toBe(false);
    expect(isBehind(null, "0.36.0")).toBe(false);
    expect(isBehind("0.35.0", null)).toBe(false);
    expect(isBehind("file:../x", "0.36.0")).toBe(false);
  });
});

describe("the issue link of a held package", () => {
  const web = "https://forge.example.test/";
  it("links an issue of another repository, of the project itself, and keeps a web address", () => {
    expect(getIssueLink("SOFTURE/AI#123", web, KEY)).toBe("https://forge.example.test/SOFTURE/AI/issues/123");
    expect(getIssueLink("#12", web, KEY)).toBe("https://forge.example.test/example-org/kappa-app/issues/12");
    expect(getIssueLink("12", web, KEY)).toBe("https://forge.example.test/example-org/kappa-app/issues/12");
    expect(getIssueLink("https://forge.example.test/a/b/issues/1", web, KEY)).toBe("https://forge.example.test/a/b/issues/1");
  });

  it("has no link for anything else", () => {
    expect(getIssueLink("javascript:alert(1)", web, KEY)).toBeNull();
    expect(getIssueLink("see the chat", web, KEY)).toBeNull();
  });
});
