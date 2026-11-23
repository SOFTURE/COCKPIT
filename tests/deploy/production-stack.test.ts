import { readFileSync } from "node:fs";
import { checkSharedHostCompose } from "@softure-ai/deploy/testing";
import { describe, expect, it } from "vitest";

const COMPOSE = readFileSync("docker/prod/docker-compose.yml", "utf8");
const DEPLOY_WORKFLOW = readFileSync(".github/workflows/deploy.yml", "utf8");
const DEPLOY_CONFIG: unknown = JSON.parse(readFileSync("deploy.json", "utf8"));

/** Names the repository variables give (`app-vars: toJSON(vars)`); `softure-host app add` sets APP_HOST. */
const VARIABLE_NAMES = ["APP_HOST"];

/** Every name the compose file requires: `${NAME:?…}` or `${NAME?…}`, the names `softure-deploy env render` renders. */
function getRequiredNames(compose: string): string[] {
  const names = [...compose.matchAll(/\$\{([A-Z][A-Z0-9_]*):?\?/g)].map((match) => match[1] ?? "");
  return [...new Set(names)].sort();
}

/** The names the deploy step reads from the environment's secrets (`secret-names:`). */
function getSecretNames(workflow: string): string[] {
  const line = /^\s*secret-names:\s*(.+)$/m.exec(workflow)?.[1] ?? "";
  return line.trim().split(/\s+/).filter(Boolean).sort();
}

describe("the production stack", () => {
  it("is safe next to other apps on the host's shared edge", () => {
    expect(checkSharedHostCompose(COMPOSE, { edgeNetwork: "softure-edge", namePrefix: "cockpit" })).toEqual([]);
  });

  it("hands every required name to the release, as a secret or a repository variable", () => {
    expect(getRequiredNames(COMPOSE)).toEqual([...getSecretNames(DEPLOY_WORKFLOW), ...VARIABLE_NAMES].sort());
  });

  it("requires the app's own secrets", () => {
    expect(getSecretNames(DEPLOY_WORKFLOW)).toEqual(
      ["EDGE_PROOF_SECRET", "FORGE_TOKEN", "POSTGRES_PASSWORD", "SOFTURE_APP_PASSWORD", "SOFTURE_MIGRATOR_PASSWORD"],
    );
    for (const name of getSecretNames(DEPLOY_WORKFLOW)) {
      expect(DEPLOY_WORKFLOW).toContain(`${name}: \${{ secrets.${name} }}`);
    }
  });

  it("names no host: the domain comes from APP_HOST at deploy time", () => {
    for (const file of [COMPOSE, DEPLOY_WORKFLOW]) {
      // The forge's public API is the one host the stack names (FORGE_API_URL's default).
      expect(file.replaceAll("https://api.github.com", "")).not.toMatch(/https:\/\/[a-z0-9-]+\.[a-z]/i);
      expect(file).not.toMatch(/Host\(`[a-z0-9.-]+`\)/i);
    }
    expect(COMPOSE).toContain("APP_ORIGIN: https://${APP_HOST:?}");
    expect(DEPLOY_WORKFLOW).toContain("app-url: https://${{ vars.APP_HOST }}");
  });

  it("backs the database up inside the postgres service, which publishes no port", () => {
    expect(DEPLOY_CONFIG).toMatchObject({ database: { access: "compose-exec" } });
  });

  it("verifies the health route and checks the build production runs", () => {
    const routes = (DEPLOY_CONFIG as { verify?: { routes?: unknown[] } }).verify?.routes ?? [];
    expect(routes).toContainEqual({ path: "/api/health", contains: ['"status":"ok"'] });
    expect(DEPLOY_WORKFLOW).toContain("build-info-path: /api/health/build");
  });
});
