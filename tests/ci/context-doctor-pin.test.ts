import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const CI_WORKFLOW = readFileSync(".github/workflows/ci.yml", "utf8");
const LOCKFILE: unknown = JSON.parse(readFileSync("package-lock.json", "utf8"));

/** The @softure-ai/skills version the lockfile resolves; the doctor in CI must run this same version. */
function getLockedSkillsVersion(lockfile: unknown): string {
  const packages = (lockfile as { packages?: Record<string, { version?: string }> }).packages ?? {};
  return packages["node_modules/@softure-ai/skills"]?.version ?? "";
}

/** Every @softure-ai/skills version the workflow pins for `npx --package`. */
function getPinnedSkillsVersions(workflow: string): string[] {
  return [...workflow.matchAll(/@softure-ai\/skills@([0-9][^\s"']*)/g)].map((match) => match[1] ?? "");
}

describe("context-doctor check in CI", () => {
  it("runs the @softure-ai/skills version the lockfile resolves", () => {
    const locked = getLockedSkillsVersion(LOCKFILE);
    expect(locked).not.toBe("");
    expect(getPinnedSkillsVersions(CI_WORKFLOW)).toEqual([locked]);
  });
});
