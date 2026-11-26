// CT-26: every list row in COCKPIT is the theme's `ListEntry` in the theme's `ListItem`; the local row is gone. Reads
// the row components' sources and renders one row to check the theme's markup.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getMessages } from "../../messages/index.ts";
import { ScanProjectRow } from "../../src/scan/scan-project-row.tsx";

const ROOT = path.resolve(import.meta.dirname, "../..");

/** Every file that renders list rows, one per list screen or row kind. */
const ROW_FILES = [
  "src/overview/overview-row.tsx",
  "src/inbox/inbox-row.tsx",
  "src/inbox/answered-earlier-row.tsx",
  "src/broadcast/send-row.tsx",
  "app/(app)/broadcast/page.tsx",
  "src/project-page/project-page-sections.tsx",
  "src/project-page/history/history-sections.tsx",
  "src/routines/routines-section.tsx",
  "src/routines/fired-issue-row.tsx",
  "src/projects/watched-repository-list.tsx",
  "src/team/member-list.tsx",
  "src/scan/scan-project-row.tsx",
  "src/adapters/packages/packages-details.tsx",
  "src/adapters/deploy/deploys-list.tsx",
  "src/scheduled/scheduled-task-row.tsx",
  "src/scheduled/scheduled-run-row.tsx",
] as const;

function read(file: string): string {
  return readFileSync(path.join(ROOT, file), "utf8");
}

describe("list rows on the theme's ListEntry", () => {
  it("has no local list row any more", () => {
    expect(existsSync(path.join(ROOT, "src/shell/list-row.tsx"))).toBe(false);
    expect(existsSync(path.join(ROOT, "src/shell/row-inset.ts"))).toBe(false);
  });

  it.each(ROW_FILES)("%s renders its rows as ListEntry in ListItem", (file) => {
    const source = read(file);
    expect(source).not.toContain("list-row.tsx");
    expect(source).toMatch(/import \{[^}]*\bListEntry\b[^}]*\bListItem\b[^}]*\} from "@softure-ai\/theme-notion"/);
    expect(source).toContain("<ListEntry");
    expect(source).not.toContain("<ListRow");
  });

  it("renders a row as the theme's ListEntry inside the theme's ListItem", () => {
    const markup = renderToStaticMarkup(
      <ScanProjectRow
        project={{ key: "example-org/alpha-app", fullName: "example-org/alpha-app", status: "ok", hasIssuesProblem: false, readAt: null, lastGoodAt: null }}
        copy={getMessages("en").scan}
        formatTime={() => "13:00"}
      />,
    );
    expect(markup).toMatch(/^<li data-slot="list-item"[^>]*><div data-slot="list-entry"/);
    expect(markup).toContain('data-slot="list-entry-identity"');
    expect(markup).toMatch(/data-slot="list-entry-status"[^>]*>.*Read/);
    expect(markup).toMatch(/<\/div><\/li>$/);
  });
});
