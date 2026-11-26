import { describe, expect, it } from "vitest";
import type { StoredAdapterRead } from "../../modules/adapters/reads.ts";
import { getDeployRows, hasNewSecrets } from "../../src/adapters/deploy/deploys-view.ts";

const READ_AT = new Date("2026-11-22T10:00:00Z");
const LAST = { result: "passed", version: "v1.0.0", verify: "passed", failedStep: null, url: "https://forge.example.test/runs/1", at: "2026-11-20T08:00:00Z" } as const;
const PRODUCTION = { version: "v1.0.0", at: "2026-11-20T08:00:00Z" };

function read(key: string, fields: Partial<StoredAdapterRead> & Pick<StoredAdapterRead, "status">): StoredAdapterRead {
  return { key, adapter: "deploy", readAt: READ_AT, ...fields } as StoredAdapterRead;
}

function repository(name: string) {
  return { key: `example-org/${name}`, fullName: `example-org/${name}`, groupId: null };
}

describe("the Deploys page rows", () => {
  it("lists only projects with a deploy source, by name", () => {
    const reads = [
      read("example-org/zulu-app", { status: "value", value: { production: PRODUCTION, last: LAST } }),
      read("example-org/alpha-app", { status: "unknown", reason: "runs_unreadable" }),
      read("example-org/docs-app", { status: "absent" }),
    ];
    const rows = getDeployRows([repository("zulu-app"), repository("docs-app"), repository("alpha-app"), repository("never-read-app")], reads);
    expect(rows.map((row) => [row.fullName, row.deploy.kind])).toEqual([
      ["example-org/alpha-app", "unknown"],
      ["example-org/zulu-app", "state"],
    ]);
  });

  it("carries each project's group onto its row (CT-35)", () => {
    const reads = [read("oak-works/oak-app", { status: "value", value: { production: PRODUCTION, last: LAST } }), read("example-org/loose-app", { status: "unknown", reason: "runs_unreadable" })];
    const rows = getDeployRows(
      [
        { key: "oak-works/oak-app", fullName: "oak-works/oak-app", groupId: 7 },
        { key: "example-org/loose-app", fullName: "example-org/loose-app", groupId: null },
      ],
      reads,
    );
    expect(rows.map((row) => [row.fullName, row.groupId])).toEqual([
      ["example-org/loose-app", null],
      ["oak-works/oak-app", 7],
    ]);
  });

  it("lists none without watched projects", () => {
    expect(getDeployRows([], [])).toEqual([]);
  });

  it("marks only an app whose compose file gained required secrets", () => {
    const waiting = (added: string[] | null) => ({
      production: PRODUCTION,
      last: LAST,
      waiting: { release: "v1.0.0", merged: { count: 0, isLowerBound: false }, secrets: added === null ? null : { since: "v1.0.0", added } },
    });
    const rows = getDeployRows(
      [repository("added-app"), repository("same-app"), repository("unknown-app"), repository("old-read-app")],
      [
        read("example-org/added-app", { status: "value", value: waiting(["MAIL_KEY"]) }),
        read("example-org/same-app", { status: "value", value: waiting([]) }),
        read("example-org/unknown-app", { status: "value", value: waiting(null) }),
        read("example-org/old-read-app", { status: "value", value: { production: PRODUCTION, last: LAST } }),
      ],
    );
    expect(rows.map((row) => [row.fullName, hasNewSecrets(row)])).toEqual([
      ["example-org/added-app", true],
      ["example-org/old-read-app", false],
      ["example-org/same-app", false],
      ["example-org/unknown-app", false],
    ]);
  });
});
