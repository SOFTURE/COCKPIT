import { describe, expect, it } from "vitest";
import { parseDeploymentRows } from "../../src/adapters/deploy/release-report.ts";
import { CLI_RELEASE_BODY, createReleaseBody } from "../support/deploy-fixture.ts";

describe("the release report's deployment rows", () => {
  it("reads the rows the package's CLI wrote, newest first", () => {
    expect(parseDeploymentRows(CLI_RELEASE_BODY)).toEqual([
      {
        at: "2026-11-12T10:00:00Z",
        outcome: "failed",
        failedStep: "migrate",
        environment: "production",
        verify: "skipped",
        runUrl: "https://github.com/example-org/kappa-app/actions/runs/507",
        runId: 507,
      },
      {
        at: "2026-11-10T09:12:00Z",
        outcome: "deployed",
        failedStep: null,
        environment: "production",
        verify: "passed",
        runUrl: "https://github.com/example-org/kappa-app/actions/runs/501",
        runId: 501,
      },
    ]);
  });

  it("writes fixtures the way the CLI does", () => {
    const body = createReleaseBody([
      { when: "2026-11-12 10:00", result: { failedAt: "migrate" }, verify: "skipped", runUrl: "https://github.com/example-org/kappa-app/actions/runs/507" },
    ]);
    expect(parseDeploymentRows(body)).toEqual([parseDeploymentRows(CLI_RELEASE_BODY)[0]]);
  });

  it("finds nothing in a body without a deployments section", () => {
    expect(parseDeploymentRows("")).toEqual([]);
    expect(parseDeploymentRows("Notes only.\n\n| a | b |\n| --- | --- |\n| 1 | 2 |")).toEqual([]);
    expect(parseDeploymentRows("<!-- softure-deploy:deployments -->\n## Deployments\n")).toEqual([]);
  });

  it("skips rows that do not match the format and keeps the others", () => {
    const valid = "| 2026-11-10 09:12 | ✅ deployed | staging | — | — | ⏳ pending | [run](https://forge.example.test/actions/runs/9) |";
    const body = [
      "<!-- softure-deploy:deployments -->",
      "| When (UTC) | Result | Environment | Image | Database | Verify | Run |",
      "| --- | --- | --- | --- | --- | --- | --- |",
      "| yesterday | ✅ deployed | production | — | — | ✅ success | [run](https://forge.example.test/actions/runs/8) |",
      "| 2026-11-10 09:12 | ✅ deployed | production | — | — | ✅ success | no link |",
      "| 2026-11-10 09:12 | ✅ deployed |",
      valid,
      "<!-- /softure-deploy:deployments -->",
    ].join("\n");
    expect(parseDeploymentRows(body)).toEqual([
      { at: "2026-11-10T09:12:00Z", outcome: "deployed", failedStep: null, environment: "staging", verify: null, runUrl: "https://forge.example.test/actions/runs/9", runId: 9 },
    ]);
  });

  it("reads a cancelled deploy and an unknown run id", () => {
    const body = createReleaseBody([{ when: "2026-11-10 09:12", result: "deployed", verify: "failure", runUrl: "https://forge.example.test/run/x" }]).replace(
      "✅ deployed",
      "⛔ cancelled",
    );
    expect(parseDeploymentRows(body)).toEqual([
      { at: "2026-11-10T09:12:00Z", outcome: "cancelled", failedStep: null, environment: "production", verify: "failed", runUrl: "https://forge.example.test/run/x", runId: null },
    ]);
  });
});
