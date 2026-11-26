// CT-24: a held package names its issue (or that it has none) once, on the muted line under its name, and has no
// right column; the last package update says its event once, as its badge, with the time standing alone.
import { TooltipProvider } from "@softure-ai/theme-notion";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getMessages } from "../../messages/index.ts";
import { PackagesDetails } from "../../src/adapters/packages/packages-details.tsx";
import type { HeldPackage, PackageUpdate } from "../../src/adapters/packages/packages-state.ts";
import { getResultBadge } from "../support/result-badge-markup.ts";
import { countText, getRowPart } from "../support/row-markup.ts";

const COPY = getMessages("en").packages;

function render(held: readonly HeldPackage[], update: PackageUpdate = { kind: "none" }): string {
  // The "?" help of an update without a pull request is a tooltip: the app's layout provides it.
  return renderToStaticMarkup(
    <TooltipProvider>
      <PackagesDetails
        view={{ kind: "state", state: { update, held: [...held], packages: [] } }}
        copy={COPY}
        webUrl="https://forge.example.test"
        fullName="example-org/alpha-app"
        formatTime={() => "Nov 24, 2026, 4:00 AM"}
      />
    </TooltipProvider>,
  );
}

function heldRow(markup: string, name: string): string {
  const start = markup.indexOf(`data-held-package="${name}"`);
  const end = markup.indexOf("</li>", start);
  return markup.slice(start, end);
}

describe("a held package row", () => {
  it("says it has no issue once, on the left, with no right column", () => {
    const row = heldRow(render([{ package: "@softure-ai/auth", issue: null, since: "2026-11-21" }]), "@softure-ai/auth");
    expect(countText(row, COPY.heldNoIssue)).toBe(1);
    expect(countText(getRowPart(row, "identity"), COPY.heldNoIssue)).toBe(1);
    expect(row).not.toContain('data-slot="list-entry-side"');
  });

  it("links its issue once, on the left, next to its date", () => {
    const row = heldRow(render([{ package: "@softure-ai/ui", issue: "SOFTURE/AI#123", since: "2026-11-20" }]), "@softure-ai/ui");
    expect(countText(row, "SOFTURE/AI#123")).toBe(1);
    expect(countText(row, "since 2026-11-20")).toBe(1);
    expect(getRowPart(row, "identity")).toContain("/SOFTURE/AI/issues/123");
    expect(row).not.toContain('data-slot="list-entry-side"');
  });

  it("names an issue it cannot link as text, once", () => {
    const row = heldRow(render([{ package: "@softure-ai/ui", issue: "an issue elsewhere", since: null }]), "@softure-ai/ui");
    expect(countText(row, "an issue elsewhere")).toBe(1);
    expect(row).not.toContain("<a ");
    expect(row).not.toContain('data-slot="list-entry-side"');
  });
});

describe("the last package update", () => {
  const pull = { kind: "pull", number: 50, url: "https://forge.example.test/example-org/alpha-app/pull/50", at: "2026-11-24T03:00:00Z", checks: "none", failingCheck: null } as const;

  it("says merged once, as its badge", () => {
    const markup = render([], { ...pull, state: "merged" });
    expect(countText(markup, "merged")).toBe(1);
    expect(countText(markup, "Nov 24, 2026, 4:00 AM")).toBe(1);
  });

  it("says open once, as its badge", () => {
    const markup = render([], { ...pull, state: "open" });
    expect(countText(markup, "open")).toBe(1);
    expect(countText(markup, "opened")).toBe(0);
  });
});

describe("the badges of the packages tab (CT-28)", () => {
  it("marks a package behind orange and a current one green, each with its own state attribute", () => {
    const markup = renderToStaticMarkup(
      <TooltipProvider>
        <PackagesDetails
          view={{
            kind: "state",
            state: {
              update: { kind: "none" },
              held: [],
              packages: [
                { name: "@softure-ai/skills", locked: "0.35.0", latest: "0.36.0" },
                { name: "@softure-ai/auth", locked: "1.0.0", latest: "1.0.0" },
              ],
            },
          }}
          copy={COPY}
          webUrl="https://forge.example.test"
          fullName="example-org/alpha-app"
          formatTime={() => "Nov 24, 2026, 4:00 AM"}
        />
      </TooltipProvider>,
    );
    const behind = getResultBadge(markup, "data-package-version", "behind");
    expect(behind.attributes["data-tone"]).toBe("warning");
    expect(behind.word).toBe(COPY.behind);
    const current = getResultBadge(markup, "data-package-version", "current");
    expect(current.attributes["data-color"]).toBe("green");
    expect(getResultBadge(markup, "data-package-update-state", "none").attributes["data-tone"]).toBe("muted");
  });
});
