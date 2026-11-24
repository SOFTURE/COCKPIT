// Fictional deploy workflow runs and GitHub Release bodies carrying the deployment history of
// `softure-deploy release-report` (@softure-ai/deploy), for the deploy adapter's tests and the e2e fake forge.

/**
 * A release body written by `npx softure-deploy release-report` (@softure-ai/deploy 0.7.9) from two fictional
 * `deploy-report.json` files: run 501 deployed v1.4.0, then run 507 failed at the server's `migrate` step. Kept byte
 * for byte, so the parser is tested against the package's own output.
 */
export const CLI_RELEASE_BODY = `Owner text.

<!-- softure-deploy:status -->
## Pipeline status

| Job | Result |
| --- | --- |
| build | ✅ success |
| deploy | ❌ failure |
| verify | ⏭️ skipped |

Run: [2026-11-12 10:00 UTC](https://github.com/example-org/kappa-app/actions/runs/507)
<!-- /softure-deploy:status -->

<!-- softure-deploy:deployments -->
## Deployments

| When (UTC) | Result | Environment | Image | Database | Verify | Run |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-11-12 10:00 | ❌ failed at migrate | production | \`ghcr.io/example-org/kappa-app\`<br>\`sha256:2222\` | — | ⏭️ skipped | [run](https://github.com/example-org/kappa-app/actions/runs/507) |
| 2026-11-10 09:12 | ✅ deployed | production | \`ghcr.io/example-org/kappa-app\`<br>\`sha256:111111111111…\` | backup: \`kappa-2026-11-10.sql.gz\` | ✅ success | [run](https://github.com/example-org/kappa-app/actions/runs/501) |
<!-- /softure-deploy:deployments -->
`;

export interface FixtureDeployment {
  /** `YYYY-MM-DD HH:MM` (UTC). */
  readonly when: string;
  readonly result: "deployed" | { readonly failedAt: string };
  readonly environment?: string;
  readonly verify: "success" | "failure" | "skipped";
  readonly runUrl: string;
}

const ICONS = { success: "✅", failure: "❌", skipped: "⏭️" } as const;

function toRow(deployment: FixtureDeployment): string {
  const result = deployment.result === "deployed" ? "✅ deployed" : `❌ failed at ${deployment.result.failedAt}`;
  const cells = [
    deployment.when,
    result,
    deployment.environment ?? "production",
    "`ghcr.io/example-org/app`",
    "—",
    `${ICONS[deployment.verify]} ${deployment.verify}`,
    `[run](${deployment.runUrl})`,
  ];
  return `| ${cells.join(" | ")} |`;
}

/** A release body in the CLI's format with the given deployments, newest first. */
export function createReleaseBody(deployments: readonly FixtureDeployment[]): string {
  return [
    "<!-- softure-deploy:deployments -->",
    "## Deployments",
    "",
    "| When (UTC) | Result | Environment | Image | Database | Verify | Run |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...deployments.map(toRow),
    "<!-- /softure-deploy:deployments -->",
  ].join("\n");
}

export interface FixtureDeployRun {
  readonly id: number;
  readonly event: "release" | "workflow_dispatch";
  /** The tag for a release run, the branch for a dispatch run. */
  readonly headBranch: string;
  readonly status?: "completed" | "in_progress";
  readonly conclusion?: "success" | "failure" | "cancelled" | null;
  readonly createdAt: string;
  readonly htmlUrl: string;
}

/** A run of the deploy workflow as the forge lists it. */
export function deployRun(run: FixtureDeployRun) {
  const status = run.status ?? "completed";
  return {
    id: run.id,
    name: "deploy",
    path: ".github/workflows/deploy.yml",
    head_branch: run.headBranch,
    event: run.event,
    status,
    conclusion: status === "completed" ? (run.conclusion ?? "success") : null,
    html_url: run.htmlUrl,
    created_at: run.createdAt,
    updated_at: run.createdAt,
  };
}
