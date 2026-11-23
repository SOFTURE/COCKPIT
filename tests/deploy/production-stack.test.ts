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

/** The digest's settings (FR-12): optional, so a release without a mail provider still deploys with the digest off. */
const DIGEST_SECRET_NAMES = [
  "DIGEST_RECIPIENTS",
  "MAILING_UNSUBSCRIBE_SECRET",
  "MAILING_UNSUBSCRIBE_SECRET_PREVIOUS",
  "RESEND_API_KEY",
];
const DIGEST_VARIABLE_NAMES = ["DIGEST_AT", "MAIL_FROM"];

/** The observability adapter's settings (FR-16): optional, read by the worker's scan only; unset, health stays off. */
const OBSERVABILITY_SECRET_NAMES = ["GRAFANA_TOKEN"];
const OBSERVABILITY_VARIABLE_NAMES = ["GRAFANA_URL"];

/** The compose file's block of one service: its lines up to the next service or top-level key. */
function getServiceBlock(compose: string, service: string): string {
  const start = compose.indexOf(`\n  ${service}:\n`);
  if (start === -1) {
    throw new Error(`getServiceBlock: no service ${service} in the compose file`);
  }
  const rest = compose.slice(start + 1);
  const end = rest.slice(1).search(/\n( {2}[a-z]|[a-z])/);
  return end === -1 ? rest : rest.slice(0, end + 1);
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
    expect(getRequiredNames(COMPOSE)).toEqual(
      [...getSecretNames(DEPLOY_WORKFLOW).filter(
        (name) => !DIGEST_SECRET_NAMES.includes(name) && !OBSERVABILITY_SECRET_NAMES.includes(name),
      ), ...VARIABLE_NAMES].sort(),
    );
  });

  it("requires the app's own secrets and passes the digest's and the observability's optional ones", () => {
    expect(getSecretNames(DEPLOY_WORKFLOW)).toEqual(
      [
        "EDGE_PROOF_SECRET",
        "FORGE_TOKEN",
        "POSTGRES_PASSWORD",
        "SOFTURE_APP_PASSWORD",
        "SOFTURE_MIGRATOR_PASSWORD",
        ...DIGEST_SECRET_NAMES,
        ...OBSERVABILITY_SECRET_NAMES,
      ].sort(),
    );
    for (const name of getSecretNames(DEPLOY_WORKFLOW)) {
      expect(DEPLOY_WORKFLOW).toContain(`${name}: \${{ secrets.${name} }}`);
    }
  });

  it.each(["app", "worker"])("hands the digest settings to the %s, each optional", (service) => {
    const block = getServiceBlock(COMPOSE, service);
    for (const name of [...DIGEST_SECRET_NAMES, ...DIGEST_VARIABLE_NAMES]) {
      expect(block).toMatch(new RegExp(`\\n {6}${name}: \\$\\{${name}:-[^}]*\\}\\n`));
    }
    expect(block).toContain("DIGEST_AT: ${DIGEST_AT:-08:00}");
  });

  it("hands the observability settings to the worker only, each optional and empty by default", () => {
    const worker = getServiceBlock(COMPOSE, "worker");
    const app = getServiceBlock(COMPOSE, "app");
    for (const name of [...OBSERVABILITY_SECRET_NAMES, ...OBSERVABILITY_VARIABLE_NAMES]) {
      expect(worker).toContain(`\n      ${name}: \${${name}:-}\n`);
      expect(app).not.toContain(name);
    }
    for (const name of OBSERVABILITY_VARIABLE_NAMES) {
      expect(getSecretNames(DEPLOY_WORKFLOW)).not.toContain(name);
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
