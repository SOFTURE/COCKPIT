// Packs the `cockpit` command as a standalone npm package (CMP-18): one bundled file with no runtime dependencies,
// a manifest derived from the root package.json, the package readme and the license. Publishing is the
// `publish-cli` workflow's, run only on the owner's word.
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { z } from "zod";

export const CLI_BIN_FILE = "cockpit.mjs";
export const DEFAULT_OUT_DIR = "dist/cli-package";
const CLI_DESCRIPTION = "COCKPIT in a terminal: the overview, the inbox and one project's detail as tables or JSON";

const rootManifestSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  license: z.string().min(1),
  repository: z.object({ type: z.string(), url: z.string() }),
  engines: z.object({ node: z.string() }),
});

export interface CliManifest {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly license: string;
  readonly type: "module";
  readonly repository: { readonly type: string; readonly url: string };
  readonly engines: { readonly node: string };
  readonly bin: { readonly cockpit: string };
  readonly files: readonly string[];
  readonly publishConfig: { readonly access: "public" };
}

/** The published package's manifest: the root's identity and engines, the bundled bin, nothing to install. */
export function buildCliManifest(rootManifest: unknown): CliManifest {
  const parsed = rootManifestSchema.safeParse(rootManifest);
  if (!parsed.success) {
    throw new Error(`Reading the root package.json for the CLI package failed: ${parsed.error.issues.map((issue) => issue.path.join(".")).join(", ")}`);
  }
  const root = parsed.data;
  return {
    name: root.name,
    version: root.version,
    description: CLI_DESCRIPTION,
    license: root.license,
    type: "module",
    repository: { type: root.repository.type, url: root.repository.url },
    engines: { node: root.engines.node },
    bin: { cockpit: CLI_BIN_FILE },
    files: [CLI_BIN_FILE, "README.md", "LICENSE"],
    publishConfig: { access: "public" },
  };
}

export interface PackCliOptions {
  /** The repository checkout that holds `package.json`, `LICENSE`, `cli/`. */
  readonly rootDir: string;
  /** Emptied, then filled with the package. */
  readonly outDir: string;
}

/** Writes the package into `outDir`: `cockpit.mjs`, `package.json`, `README.md`, `LICENSE`. */
export async function packCli({ rootDir, outDir }: PackCliOptions): Promise<CliManifest> {
  const manifest = buildCliManifest(JSON.parse(await readFile(path.join(rootDir, "package.json"), "utf8")));
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  await build({
    entryPoints: [path.join(rootDir, "cli/bin.ts")],
    outfile: path.join(outDir, CLI_BIN_FILE),
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node22",
    minify: true,
    legalComments: "eof",
    logLevel: "warning",
  });
  await writeFile(path.join(outDir, "package.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  await copyFile(path.join(rootDir, "cli/README.md"), path.join(outDir, "README.md"));
  await copyFile(path.join(rootDir, "LICENSE"), path.join(outDir, "LICENSE"));
  return manifest;
}

const isEntryPoint = process.argv[1] !== undefined && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isEntryPoint) {
  const outDir = path.resolve(process.argv[2] ?? DEFAULT_OUT_DIR);
  const manifest = await packCli({ rootDir: process.cwd(), outDir });
  process.stdout.write(`Packed ${manifest.name}@${manifest.version} into ${path.relative(process.cwd(), outDir) || "."}\n`);
}
