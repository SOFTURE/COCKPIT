import { fakeFetch, type FakeFetchRoute } from "@softure-ai/testing";
import { describe, expect, it } from "vitest";
import { createNpmRegistry } from "../../src/adapters/packages/npm-registry.ts";
import { createPackagesAdapter } from "../../src/adapters/packages/packages-adapter.ts";
import { readPackages } from "../../src/adapters/packages/read-packages.ts";
import { createForgeClient } from "../../src/forge/client.ts";
import { TEST_FORGE_API, type ScanAnswer } from "../support/fake-forge-routes.ts";

const REGISTRY = "https://registry.example.test";
const PROJECT = { owner: "example-org", name: "kappa-app", branch: "main" };
const BASE = `${TEST_FORGE_API}/repos/example-org/kappa-app`;
const PULLS_URL = `${BASE}/pulls?state=all&sort=created&direction=desc&per_page=50`;
const file = (path: string) => `${BASE}/contents/${path}?ref=main`;
const NOT_FOUND: ScanAnswer = { status: 404, json: { message: "Not Found" } };
const distTags = (name: string) => `${REGISTRY}/-/package/${encodeURIComponent(name).replace(/^%40/, "@")}/dist-tags`;

interface Answers {
  readonly manifest?: ScanAnswer;
  readonly lockfile?: ScanAnswer;
  readonly workflow?: ScanAnswer;
  readonly pulls?: ScanAnswer;
  readonly headRuns?: ScanAnswer;
  readonly jobs?: ScanAnswer;
  readonly latest?: Readonly<Record<string, ScanAnswer>>;
}

const HEAD_SHA = "c0ffee1";

function forgeRoutes(answers: Answers): FakeFetchRoute[] {
  const routes: FakeFetchRoute[] = [{ method: "GET", url: file("package.json"), ...(answers.manifest ?? NOT_FOUND) }];
  routes.push({ method: "GET", url: PULLS_URL, ...(answers.pulls ?? { json: [] }) });
  routes.push({ method: "GET", url: file("context/workflow.json"), ...(answers.workflow ?? NOT_FOUND) });
  routes.push({ method: "GET", url: file("package-lock.json"), ...(answers.lockfile ?? NOT_FOUND) });
  if (answers.headRuns !== undefined) {
    routes.push({ method: "GET", url: `${BASE}/actions/runs?head_sha=${HEAD_SHA}&per_page=100`, ...answers.headRuns });
  }
  if (answers.jobs !== undefined) {
    routes.push({ method: "GET", url: `${BASE}/actions/runs/901/jobs?filter=latest&per_page=100`, ...answers.jobs });
  }
  return routes;
}

function registryRoutes(latest: Readonly<Record<string, ScanAnswer>> = {}): FakeFetchRoute[] {
  return Object.entries(latest).map(([name, answer]) => ({ method: "GET", url: distTags(name), ...answer }));
}

function readWith(answers: Answers) {
  const forge = fakeFetch(forgeRoutes(answers));
  const registry = fakeFetch(registryRoutes(answers.latest));
  const client = createForgeClient({ token: "t", baseUrl: TEST_FORGE_API, fetch: forge.fetch });
  const adapter = createPackagesAdapter({ NPM_REGISTRY_URL: REGISTRY }, registry.fetch);
  return { forge, registry, read: () => adapter.read({ client, project: PROJECT }) };
}

const manifest = (dependencies: Record<string, string>, devDependencies: Record<string, string> = {}): ScanAnswer => ({
  json: { name: "kappa-app", dependencies, devDependencies },
});
const lockfile = (versions: Record<string, string>): ScanAnswer => ({
  json: { lockfileVersion: 3, packages: Object.fromEntries(Object.entries(versions).map(([name, version]) => [`node_modules/${name}`, { version }])) },
});
const latest = (version: string): ScanAnswer => ({ json: { latest: version, next: "9.9.9-beta.1" } });

function pull(overrides: { number: number; title?: string; ref?: string; state?: string; createdAt?: string; mergedAt?: string | null }) {
  return {
    number: overrides.number,
    title: overrides.title ?? "chore(deps): bump SOFTURE packages (2026-11-24)",
    state: overrides.state ?? "closed",
    html_url: `https://forge.example.test/example-org/kappa-app/pull/${String(overrides.number)}`,
    created_at: overrides.createdAt ?? "2026-11-24T02:00:00Z",
    merged_at: overrides.mergedAt === undefined ? "2026-11-24T03:00:00Z" : overrides.mergedAt,
    head: { ref: overrides.ref ?? "claude/bump-softure-2026-11-24", sha: HEAD_SHA },
  };
}

const run = (id: number, name: string, conclusion: string | null, status = "completed") => ({
  id,
  name,
  status,
  conclusion,
  html_url: `https://forge.example.test/runs/${String(id)}`,
  created_at: "2026-11-24T02:05:00Z",
});
const job = (name: string, conclusion: string) => ({ id: name.length, name, status: "completed", conclusion, html_url: null });

describe("the packages adapter", () => {
  it("reads the last merged update, the held packages and each version against the newest on npm", async () => {
    const { read } = readWith({
      manifest: manifest({ "@softure-ai/auth": "^0.2.21", "@softure-ai/ui": "^0.3.0", react: "^19.0.0" }, { "@softure-ai/skills": "^0.35.0" }),
      lockfile: lockfile({ "@softure-ai/auth": "0.2.23", "@softure-ai/ui": "0.3.11", "@softure-ai/skills": "0.35.0", react: "19.3.1" }),
      workflow: { json: { routines: { packageUpdates: { hold: [{ package: "@softure-ai/ui", issue: "SOFTURE/AI#123", since: "2026-11-20" }] } } } },
      pulls: { json: [pull({ number: 7, title: "feat: other work", ref: "feature/x", mergedAt: null, state: "open" }), pull({ number: 5 })] },
      latest: { "@softure-ai/auth": latest("0.2.23"), "@softure-ai/ui": latest("0.4.0"), "@softure-ai/skills": latest("0.36.0") },
    });
    await expect(read()).resolves.toEqual({
      status: "value",
      value: {
        update: { kind: "pull", number: 5, url: "https://forge.example.test/example-org/kappa-app/pull/5", state: "merged", at: "2026-11-24T03:00:00Z", checks: "none", failingCheck: null },
        held: [{ package: "@softure-ai/ui", issue: "SOFTURE/AI#123", since: "2026-11-20" }],
        packages: [
          { name: "@softure-ai/skills", locked: "0.35.0", latest: "0.36.0" },
          { name: "@softure-ai/auth", locked: "0.2.23", latest: "0.2.23" },
          { name: "@softure-ai/ui", locked: "0.3.11", latest: "0.4.0" },
        ],
      },
    });
  });

  it("names the failing check of an open update whose checks are red", async () => {
    const { read } = readWith({
      manifest: manifest({}),
      pulls: { json: [pull({ number: 9, state: "open", mergedAt: null })] },
      headRuns: { json: { workflow_runs: [run(900, "quality-review", "success"), run(901, "ci", "failure")] } },
      jobs: { json: { jobs: [job("gates", "success"), job("e2e", "failure")] } },
    });
    const result = await read();
    expect(result).toMatchObject({ status: "value", value: { update: { kind: "pull", number: 9, state: "open", at: "2026-11-24T02:00:00Z", checks: "failed", failingCheck: "e2e" } } });
  });

  it("falls back to the run's name when the jobs of a red run cannot be read", async () => {
    const { read } = readWith({
      manifest: manifest({}),
      pulls: { json: [pull({ number: 9, state: "open", mergedAt: null })] },
      headRuns: { json: { workflow_runs: [run(901, "ci", "failure")] } },
      jobs: { status: 403, json: { message: "Resource not accessible" } },
    });
    await expect(read()).resolves.toMatchObject({ value: { update: { checks: "failed", failingCheck: "ci" } } });
  });

  it.each([
    ["passed", [run(900, "ci", "success")]],
    ["running", [run(900, "ci", null, "in_progress")]],
    ["none", []],
  ] as const)("reads an open update whose checks are %s", async (checks, runs) => {
    const { read } = readWith({ manifest: manifest({}), pulls: { json: [pull({ number: 9, state: "open", mergedAt: null })] }, headRuns: { json: { workflow_runs: runs } } });
    await expect(read()).resolves.toMatchObject({ value: { update: { state: "open", checks, failingCheck: null } } });
  });

  it("finds the update by its branch when its title was renamed, and reads a closed one as closed", async () => {
    const { read } = readWith({ manifest: manifest({}), pulls: { json: [pull({ number: 3, title: "Bump packages", mergedAt: null, createdAt: "2026-11-23T02:00:00Z" })] } });
    await expect(read()).resolves.toMatchObject({ value: { update: { kind: "pull", number: 3, state: "closed", at: "2026-11-23T02:00:00Z", checks: "none" } } });
  });

  it("says when a project has no update yet, and when its pull requests cannot be read", async () => {
    await expect(readWith({ manifest: manifest({}), pulls: { json: [pull({ number: 2, title: "docs: readme", ref: "docs" })] } }).read()).resolves.toMatchObject({
      value: { update: { kind: "none" } },
    });
    await expect(readWith({ manifest: manifest({}), pulls: { status: 403, json: { message: "Refused" } } }).read()).resolves.toMatchObject({
      value: { update: { kind: "unknown" } },
    });
  });

  it("reads a package without a lockfile entry as not locked, and an unanswered registry as newest unknown", async () => {
    const { read } = readWith({
      manifest: manifest({ "@softure-ai/deploy": "^0.7.0" }),
      latest: { "@softure-ai/deploy": { status: 503, json: { message: "Unavailable" } } },
    });
    await expect(read()).resolves.toMatchObject({ value: { packages: [{ name: "@softure-ai/deploy", locked: null, latest: null }], held: [] } });
  });

  it("reads held packages as unknown when the workflow cannot be read, and skips entries without a package", async () => {
    await expect(readWith({ manifest: manifest({}), workflow: { status: 403, json: { message: "Refused" } } }).read()).resolves.toMatchObject({ value: { held: null } });
    const workflow: ScanAnswer = { json: { routines: { packageUpdates: { hold: [{ issue: "#4" }, { package: "@softure-ai/jobs", issue: 12, since: "" }] } } } };
    await expect(readWith({ manifest: manifest({}), workflow }).read()).resolves.toMatchObject({
      value: { held: [{ package: "@softure-ai/jobs", issue: "12", since: null }] },
    });
  });

  it("is absent for a repository without package.json and without an update", async () => {
    const { forge, read } = readWith({});
    await expect(read()).resolves.toEqual({ status: "absent" });
    expect(forge.calls.map((call) => call.url)).toEqual([file("package.json"), PULLS_URL]);
  });

  it.each([
    ["refused", { status: 403, json: { message: "Refused" } }, "manifest_unreadable"],
    ["not an object", { json: ["not", "a", "manifest"] }, "manifest_invalid"],
  ] as const)("is unknown when package.json is %s", async (_label, answer, reason) => {
    await expect(readWith({ manifest: answer }).read()).resolves.toEqual({ status: "unknown", reason });
  });

  it("stops the scan on a forge rate limit", async () => {
    const limited: ScanAnswer = { status: 429, json: { message: "slow down" }, headers: { "retry-after": "30" } };
    await expect(readWith({ manifest: limited }).read()).resolves.toEqual({ status: "rate_limited", retryAfterSeconds: 30 });
    await expect(readWith({ manifest: manifest({}), pulls: limited }).read()).resolves.toEqual({ status: "rate_limited", retryAfterSeconds: 30 });
    await expect(readWith({ manifest: manifest({ "@softure-ai/ui": "^0.3.0" }), lockfile: limited }).read()).resolves.toEqual({
      status: "rate_limited",
      retryAfterSeconds: 30,
    });
  });

  it("asks the registry once per package across the projects of one scan", async () => {
    const forge = fakeFetch([
      ...forgeRoutes({ manifest: manifest({ "@softure-ai/ui": "^0.3.0" }) }),
      ...forgeRoutes({ manifest: manifest({ "@softure-ai/ui": "^0.3.0" }) }),
    ]);
    const registry = fakeFetch(registryRoutes({ "@softure-ai/ui": latest("0.4.0") }));
    const client = createForgeClient({ token: "t", baseUrl: TEST_FORGE_API, fetch: forge.fetch });
    const npm = createNpmRegistry(REGISTRY, registry.fetch);
    await readPackages({ client, project: PROJECT, registry: npm });
    await readPackages({ client, project: PROJECT, registry: npm });
    expect(registry.calls).toHaveLength(1);
  });

  it("stops asking a registry that cannot be reached", async () => {
    const registry = fakeFetch([{ method: "GET", url: /dist-tags$/, throws: new TypeError("fetch failed"), repeat: true }]);
    const npm = createNpmRegistry(REGISTRY, registry.fetch);
    await expect(npm.getLatestVersion("@softure-ai/ui")).resolves.toBeNull();
    await expect(npm.getLatestVersion("@softure-ai/auth")).resolves.toBeNull();
    expect(registry.calls).toHaveLength(1);
  });
});
