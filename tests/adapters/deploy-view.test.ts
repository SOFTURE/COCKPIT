import { describe, expect, it } from "vitest";
import { getDeployView } from "../../src/adapters/deploy/deploy-view.ts";
import type { StoredAdapterRead } from "../../modules/adapters/reads.ts";

const KEY = "example-org/kappa-app";
const READ_AT = new Date("2026-11-22T10:00:00Z");
const STATE = {
  production: { version: "v1.4.0", at: "2026-11-10T09:12:00Z" },
  last: { result: "failed", version: "v1.4.0", verify: "skipped", failedStep: "migrate", url: "https://forge.example.test/runs/507", at: "2026-11-12T10:00:00Z" },
};

function read(fields: Partial<StoredAdapterRead> & Pick<StoredAdapterRead, "status">): StoredAdapterRead {
  return { key: KEY, adapter: "deploy", readAt: READ_AT, ...fields } as StoredAdapterRead;
}

describe("the deploy view", () => {
  it("shows nothing without a deploy read or for an absent source", () => {
    expect(getDeployView([], KEY)).toEqual({ kind: "none" });
    expect(getDeployView([read({ status: "absent" })], KEY)).toEqual({ kind: "none" });
    expect(getDeployView([read({ status: "value", value: STATE, adapter: "observability" })], KEY)).toEqual({ kind: "none" });
    expect(getDeployView([read({ status: "value", value: STATE, key: "example-org/other-app" })], KEY)).toEqual({ kind: "none" });
  });

  it("shows the stored state", () => {
    expect(getDeployView([read({ status: "value", value: STATE })], KEY)).toEqual({ kind: "state", state: STATE });
  });

  it("shows unknown with a known reason, and other for any other", () => {
    expect(getDeployView([read({ status: "unknown", reason: "runs_unreadable" })], KEY)).toEqual({ kind: "unknown", reason: "runs_unreadable" });
    expect(getDeployView([read({ status: "unknown", reason: "something_new" })], KEY)).toEqual({ kind: "unknown", reason: "other" });
  });

  it("reads a stored value that no longer matches the shape as unknown", () => {
    expect(getDeployView([read({ status: "value", value: { production: "v1" } })], KEY)).toEqual({ kind: "unknown", reason: "other" });
  });
});
