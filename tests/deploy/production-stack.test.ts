import { readFileSync } from "node:fs";
import { checkSharedHostCompose } from "@softure-ai/deploy/testing";
import { describe, expect, it } from "vitest";
import { PUBLIC_PATHS } from "../../src/security/public-paths.ts";

const COMPOSE = readFileSync("docker/prod/docker-compose.yml", "utf8");
const DEPLOY_WORKFLOW = readFileSync(".github/workflows/deploy.yml", "utf8");
const DEPLOY_CONFIG: unknown = JSON.parse(readFileSync("deploy.json", "utf8"));
const SERVER_SCRIPT = readFileSync("docker/server/deploy.sh", "utf8");
const RELEASE_WORKFLOW = readFileSync(".github/workflows/release.yml", "utf8");
const LOCKFILE: unknown = JSON.parse(readFileSync("package-lock.json", "utf8"));

/** The @softure-ai/deploy version the lockfile resolves; the server script and the workflow pins follow it. */
function getLockedDeployVersion(lockfile: unknown): string {
  const packages = (lockfile as { packages?: Record<string, { version?: string }> }).packages ?? {};
  return packages["node_modules/@softure-ai/deploy"]?.version ?? "";
}

/** The commit of the `deploy@<version>` tag in SOFTURE/AI that every `uses:` pin names. */
const DEPLOY_TAG_COMMITS: Readonly<Record<string, string>> = {
  "0.7.9": "a8f8af4c1372c63ce86b2ecfc7c08e1ac84381f2",
};

/** Names the repository variables give (`app-vars: toJSON(vars)`); `softure-host app add` sets APP_HOST. */
const VARIABLE_NAMES = ["APP_HOST"];

/** The edge network's variable: optional, the name of the shared Traefik's external network on the server. */
const EDGE_NETWORK_REFERENCE = "${EDGE_NETWORK:-softure-edge}";

/** The compose file as compose reads it with EDGE_NETWORK set to the given name, or unset (the default). */
function interpolateEdgeNetwork(compose: string, edgeNetwork?: string): string {
  return compose.replaceAll(EDGE_NETWORK_REFERENCE, edgeNetwork ?? "softure-edge");
}

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
  "SOFTURE_EMAIL_KEY_SECRET",
];
const DIGEST_VARIABLE_NAMES = ["DIGEST_AT", "MAIL_FROM"];

/** The MCP switches (FR-13, FR-14): optional variables the app reads; empty keeps writes on and diagnostics off. */
const MCP_VARIABLE_NAMES = ["MCP_ALLOW_WRITES", "MCP_DIAGNOSTICS"];

/** The observability adapter's settings (FR-16): optional, read by the worker's scan only; unset, health stays off. */
const OBSERVABILITY_SECRET_NAMES = ["GRAFANA_TOKEN"];
const OBSERVABILITY_VARIABLE_NAMES = ["GRAFANA_URL"];

/** Telemetry export (@softure-ai/observability): the gateway's Authorization header is an optional secret, the endpoint
 * an optional variable; app, worker and migrate all export. */
const TELEMETRY_SECRET_NAMES = ["OTEL_EXPORTER_OTLP_HEADERS"];
const TELEMETRY_VARIABLE_NAMES = ["OTEL_EXPORTER_OTLP_ENDPOINT"];

/** The locale: a variable, also passed as an optional secret so a locale stored as a secret still reaches the app. */
const LOCALE_SECRET_NAMES = ["APP_LOCALE"];
/** The further forge owners' tokens (F-6): optional, without them only FORGE_TOKEN reads. */
const FORGE_EXTRA_SECRET_NAMES = ["FORGE_EXTRA_TOKENS"];

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
  it.each([undefined, "example-edge"])("is safe next to other apps on the host's shared edge (EDGE_NETWORK %s)", (name) => {
    const edgeNetwork = name ?? "softure-edge";
    expect(checkSharedHostCompose(interpolateEdgeNetwork(COMPOSE, name), { edgeNetwork, namePrefix: "cockpit" })).toEqual([]);
  });

  it("joins the edge network EDGE_NETWORK names, softure-edge by default, and routes through it", () => {
    expect(COMPOSE).toContain(`\n  edge:\n    name: ${EDGE_NETWORK_REFERENCE}\n    external: true\n`);
    expect(COMPOSE).toContain(`"traefik.docker.network=${EDGE_NETWORK_REFERENCE}"`);
    expect(COMPOSE.replace(/^\s*#.*$/gm, "").replaceAll(EDGE_NETWORK_REFERENCE, "")).not.toContain("softure-edge");
    expect(getSecretNames(DEPLOY_WORKFLOW)).not.toContain("EDGE_NETWORK");
  });

  it("hands every required name to the release, as a secret or a repository variable", () => {
    expect(getRequiredNames(COMPOSE)).toEqual(
      [...getSecretNames(DEPLOY_WORKFLOW).filter(
        (name) =>
          !DIGEST_SECRET_NAMES.includes(name) &&
          !OBSERVABILITY_SECRET_NAMES.includes(name) &&
          !TELEMETRY_SECRET_NAMES.includes(name) &&
          !LOCALE_SECRET_NAMES.includes(name) &&
          !FORGE_EXTRA_SECRET_NAMES.includes(name),
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
        ...TELEMETRY_SECRET_NAMES,
        ...LOCALE_SECRET_NAMES,
        ...FORGE_EXTRA_SECRET_NAMES,
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

  it.each(["app", "worker"])("hands the further forge tokens to the %s, optional and empty by default", (service) => {
    const block = getServiceBlock(COMPOSE, service);
    for (const name of FORGE_EXTRA_SECRET_NAMES) {
      expect(block).toContain(`\n      ${name}: \${${name}:-}\n`);
    }
  });

  it("hands the MCP switches to the app, each optional and empty by default", () => {
    const block = getServiceBlock(COMPOSE, "app");
    for (const name of MCP_VARIABLE_NAMES) {
      expect(block).toContain(`\n      ${name}: \${${name}:-}\n`);
      expect(getSecretNames(DEPLOY_WORKFLOW)).not.toContain(name);
    }
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

  it.each(["app", "worker", "migrate"])("hands the telemetry export to the %s, optional, as production, with the release", (service) => {
    const block = getServiceBlock(COMPOSE, service);
    for (const name of [...TELEMETRY_SECRET_NAMES, ...TELEMETRY_VARIABLE_NAMES]) {
      expect(block).toContain(`\n      ${name}: \${${name}:-}\n`);
    }
    expect(block).toContain("\n      APP_ENVIRONMENT: production\n");
    expect(block).toContain("\n      SOFTURE_RELEASE: ${TAG}\n");
    for (const name of TELEMETRY_VARIABLE_NAMES) {
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

  it("verifies only routes that answer without a session, so the guard and the edge's sign-in never redirect them", () => {
    const routes = (DEPLOY_CONFIG as { verify?: { routes?: { path: string }[] } }).verify?.routes ?? [];
    const guardedPaths = routes
      .map((route) => route.path)
      .filter((path) => !PUBLIC_PATHS.some((publicPath) => path === publicPath || path.startsWith(`${publicPath}/`)));
    expect(guardedPaths).toEqual([]);
  });

  it("lists the guard's public paths as the paths that answer without a login, so the edge bypasses the same ones", () => {
    expect((DEPLOY_CONFIG as { publicPaths?: unknown }).publicPaths).toEqual([...PUBLIC_PATHS]);
  });

  it("pins the deploy CLI, its tools image and every SOFTURE/AI workflow to the @softure-ai/deploy version the lockfile resolves", () => {
    const version = getLockedDeployVersion(LOCKFILE);
    expect(SERVER_SCRIPT).toContain(`DEPLOY_CLI="@softure-ai/deploy@${version}"`);
    expect(SERVER_SCRIPT).toContain(`TOOLS_IMAGE="softure-deploy-tools:${version}-pg16"`);
    const pins = [...`${DEPLOY_WORKFLOW}\n${RELEASE_WORKFLOW}`.matchAll(/uses: SOFTURE\/AI\/\S+@([0-9a-f]{40})/g)].map((match) => match[1]);
    expect(pins.length).toBe(3);
    expect(new Set(pins)).toEqual(new Set([DEPLOY_TAG_COMMITS[version]]));
  });

  it("verifies a rendered page, not only the health route", () => {
    const routes = (DEPLOY_CONFIG as { verify?: { routes?: unknown[] } }).verify?.routes ?? [];
    expect(routes).toContainEqual({ path: "/unsubscribe", excludes: ["Application error"] });
  });
});
