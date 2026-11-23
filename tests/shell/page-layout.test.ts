// Every screen inside the app shell renders through PageLayout (CV-4): same width, header and spacing everywhere.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const APP_DIR = path.join(import.meta.dirname, "../../app/(app)");

function findPages(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return findPages(full);
    }
    return entry.name === "page.tsx" ? [full] : [];
  });
}

/** A page that only redirects renders no screen. */
function isRedirectOnly(source: string): boolean {
  return /redirect\(/.test(source) && !/<\w/.test(source);
}

const pages = findPages(APP_DIR)
  .map((file) => ({ name: path.relative(APP_DIR, file), source: readFileSync(file, "utf8") }))
  .filter((page) => !isRedirectOnly(page.source));

describe("the screens inside the app shell", () => {
  it("finds the screens", () => {
    expect(pages.length).toBeGreaterThanOrEqual(10);
  });

  it.each(pages)("$name renders through PageLayout", ({ source }) => {
    expect(source).toMatch(/<PageLayout[\s>]/);
    expect(source).not.toMatch(/\bPageHeader\b/);
  });

  it.each(pages)("$name does not cap its own width", ({ source }) => {
    expect(source).not.toMatch(/\bmax-w-|\bmx-auto\b/);
  });
});
