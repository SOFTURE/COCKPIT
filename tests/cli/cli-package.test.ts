import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildCliManifest, CLI_BIN_FILE, packCli } from "../../scripts/pack-cli.ts";

const ROOT_MANIFEST = {
  name: "@example/cockpit",
  version: "1.2.3",
  private: true,
  description: "The app",
  license: "MIT",
  type: "module",
  repository: { type: "git", url: "git+https://example.com/cockpit.git" },
  engines: { node: ">=22" },
  bin: { cockpit: "cli/bin.ts" },
  scripts: { build: "next build" },
  dependencies: { next: "^16.0.0" },
  devDependencies: { esbuild: "^0.28.0" },
};

interface Run {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

function runNode(file: string, args: readonly string[], cwd: string): Promise<Run> {
  return new Promise((resolve) => {
    execFile(process.execPath, [file, ...args], { cwd, env: { NODE_ENV: "production", PATH: process.env.PATH ?? "" } }, (error, stdout, stderr) => {
      resolve({ code: typeof error?.code === "number" ? error.code : error === null ? 0 : 1, stdout, stderr });
    });
  });
}

describe("buildCliManifest", () => {
  it("publishes the root's name, version, license, repository and engines with the bundled bin and no dependencies", () => {
    expect(buildCliManifest(ROOT_MANIFEST)).toEqual({
      name: "@example/cockpit",
      version: "1.2.3",
      description: "COCKPIT in a terminal: the overview, the inbox and one project's detail as tables or JSON",
      license: "MIT",
      type: "module",
      repository: { type: "git", url: "git+https://example.com/cockpit.git" },
      engines: { node: ">=22" },
      bin: { cockpit: CLI_BIN_FILE },
      files: [CLI_BIN_FILE, "README.md", "LICENSE"],
      publishConfig: { access: "public" },
    });
  });

  it("refuses a root manifest without a name or a version", () => {
    expect(() => buildCliManifest({ ...ROOT_MANIFEST, version: undefined })).toThrow("Reading the root package.json for the CLI package failed");
    expect(() => buildCliManifest({ ...ROOT_MANIFEST, name: "" })).toThrow("Reading the root package.json for the CLI package failed");
  });
});

describe("packCli", () => {
  let outDir: string;
  let elsewhere: string;

  beforeAll(async () => {
    outDir = await mkdtemp(path.join(tmpdir(), "cockpit-cli-package-"));
    elsewhere = await mkdtemp(path.join(tmpdir(), "cockpit-cli-run-"));
    await packCli({ rootDir: process.cwd(), outDir });
  });

  afterAll(async () => {
    await rm(outDir, { recursive: true, force: true });
    await rm(elsewhere, { recursive: true, force: true });
  });

  it("writes exactly the bundled bin, the manifest, the readme and the license", async () => {
    expect((await readdir(outDir)).sort()).toEqual([CLI_BIN_FILE, "LICENSE", "README.md", "package.json"].sort());
    const manifest = JSON.parse(await readFile(path.join(outDir, "package.json"), "utf8")) as Record<string, unknown>;
    const root = JSON.parse(await readFile("package.json", "utf8")) as Record<string, unknown>;
    expect(manifest).toEqual(buildCliManifest(root));
    expect(await readFile(path.join(outDir, "LICENSE"), "utf8")).toBe(await readFile("LICENSE", "utf8"));
  });

  it("bundles a bin that starts with the hashbang", async () => {
    const bundle = await readFile(path.join(outDir, CLI_BIN_FILE), "utf8");
    expect(bundle.startsWith("#!/usr/bin/env node\n")).toBe(true);
  });

  it("runs with plain node outside the checkout: help exits 0 with the usage", async () => {
    const help = await runNode(path.join(outDir, CLI_BIN_FILE), ["--help"], elsewhere);
    expect(help.code).toBe(0);
    expect(help.stderr).toBe("");
    expect(help.stdout).toMatch(/^Usage: cockpit <command> \[--json\] \[--url <url>\]\n/);
  });

  it("runs with plain node outside the checkout: no address exits 2 naming the cause, with no stack", async () => {
    const noAddress = await runNode(path.join(outDir, CLI_BIN_FILE), ["overview"], elsewhere);
    expect(noAddress).toEqual({
      code: 2,
      stdout: "",
      stderr: "No address: pass --url or set COCKPIT_URL to COCKPIT's address, for example https://cockpit.example.com.\n",
    });
  });
});
