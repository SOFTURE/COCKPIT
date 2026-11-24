// A project's nightly package updates as the packages adapter reads them (CT-1): the last pull request of the
// package-update routine (`@softure-ai/skills` `routines/package-updates.md`), the packages it holds back with their
// issue, and each `@softure-ai/*` version in the lockfile against the newest published on npm.
import { z } from "zod";

export const PACKAGES_ADAPTER_ID = "packages";

/** The routine's pull request title and branch (`chore(deps): bump SOFTURE packages (<YYYY-MM-DD>)`). */
export const UPDATE_TITLE_PATTERN = /^chore\(deps\): bump SOFTURE packages\b/i;
export const UPDATE_BRANCH_PREFIX = "claude/bump-softure-";

/** The scope whose packages the page lists. */
export const PACKAGE_SCOPE = "@softure-ai/";

/** The packages the roadmap names as key, shown first in this order; every other one follows by name. */
export const KEY_PACKAGES = ["@softure-ai/skills", "@softure-ai/auth", "@softure-ai/deploy", "@softure-ai/mailing", "@softure-ai/mcp-access"] as const;

const isoTime = z.string().min(1);

export const updateChecksSchema = z.enum(["passed", "failed", "running", "none", "unknown"]);
export type UpdateChecks = z.infer<typeof updateChecksSchema>;

export const packageUpdateSchema = z.discriminatedUnion("kind", [
  // No pull request of the routine yet.
  z.object({ kind: z.literal("none") }),
  // The pull requests could not be read.
  z.object({ kind: z.literal("unknown") }),
  z.object({
    kind: z.literal("pull"),
    number: z.number().int(),
    // Rendered as a link: only a web address, never another scheme.
    url: z.url({ protocol: /^https?$/ }),
    state: z.enum(["merged", "open", "closed"]),
    /** When it merged, or when it was opened for one that did not merge. */
    at: isoTime,
    /** The checks at its head; judged only while it is open (`none` otherwise). */
    checks: updateChecksSchema,
    /** The first failing check (a job, or the run when its jobs cannot be read); null unless `checks` is `failed`. */
    failingCheck: z.string().min(1).nullable(),
  }),
]);
export type PackageUpdate = z.infer<typeof packageUpdateSchema>;

export const heldPackageSchema = z.object({
  package: z.string().min(1),
  /** As the routine writes it: `SOFTURE/AI#123`, `#12` or a URL; null when the entry names none. */
  issue: z.string().min(1).nullable(),
  since: z.string().min(1).nullable(),
});
export type HeldPackage = z.infer<typeof heldPackageSchema>;

export const packageVersionSchema = z.object({
  name: z.string().min(1),
  /** The version in `package-lock.json`; null when the project has no lockfile entry for it. */
  locked: z.string().min(1).nullable(),
  /** The newest version on npm (`latest`); null when the registry did not answer. */
  latest: z.string().min(1).nullable(),
});
export type PackageVersion = z.infer<typeof packageVersionSchema>;

export const packagesStateSchema = z.object({
  update: packageUpdateSchema,
  /** Null when `context/workflow.json` could not be read. */
  held: z.array(heldPackageSchema).nullable(),
  packages: z.array(packageVersionSchema),
});
export type PackagesState = z.infer<typeof packagesStateSchema>;

export const PACKAGES_UNKNOWN_REASONS = [
  // `package.json` could not be read from the forge.
  "manifest_unreadable",
  // `package.json` is not a JSON object.
  "manifest_invalid",
] as const;

export type PackagesUnknownReason = (typeof PACKAGES_UNKNOWN_REASONS)[number];
